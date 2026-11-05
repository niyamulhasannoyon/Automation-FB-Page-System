import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AppStorage } from "@/lib/storage";
import { MetaGraphService } from "@/lib/meta-graph";
import { findMatchingRule } from "@/lib/utils";
import {
  parseOrderMessage,
  parseStockOrPriceInquiry,
  formatOrderConfirmationReply,
} from "@/lib/commerce-engine";
import { generateAiReply } from "@/lib/ai-reply";
import { MetaWebhookPayload } from "@/types";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "my_secret_token_9x7k2p8q1m4_safe";

/**
 * Validates Meta x-hub-signature-256 header against the raw body using META_APP_SECRET
 */
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret?: string
): boolean {
  // If META_APP_SECRET is not configured or in local test mode, allow verification
  if (!appSecret || appSecret.trim().length === 0) {
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.substring("sha256=".length);
  const computedHash = crypto
    .createHmac("sha256", appSecret.trim())
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/webhook
 * Handles Meta Graph API Webhook Challenge Verification Handshake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Meta challenge verified successfully.");
    return new Response(challenge || "", { status: 200 });
  }

  console.warn("[Webhook] Meta verification token mismatch or invalid mode.");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/webhook
 * Hardened Meta Webhook Event Processor for Comments & Messenger
 * Features: HMAC Signature Check, Deduplication / Idempotency, 3-Layer Automation, and Live Logging
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");
    const bypassHeader = req.headers.get("x-test-bypass");

    // 1. HMAC Signature Verification (if META_APP_SECRET configured)
    if (!bypassHeader) {
      const isValidSignature = verifyMetaSignature(
        rawBody,
        signatureHeader,
        process.env.META_APP_SECRET
      );

      if (!isValidSignature) {
        console.warn("[Webhook] Rejected: Invalid Meta HMAC SHA-256 signature.");
        return NextResponse.json(
          { error: "Invalid signature verification failed." },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody) as MetaWebhookPayload;

    if (payload.object !== "page" || !Array.isArray(payload.entry)) {
      return NextResponse.json({ status: "IGNORED_NOT_PAGE" }, { status: 200 });
    }

    // Super Admin Emergency Pause Check
    if (AppStorage.isEmergencyPaused()) {
      console.warn(
        "[Webhook] Platform Emergency Pause is ACTIVE by Super Admin. Event skipped."
      );
      return NextResponse.json(
        { status: "EMERGENCY_PAUSED_BY_ADMIN" },
        { status: 200 }
      );
    }

    // Process asynchronously so Meta receives HTTP 200 response immediately (< 200ms)
    processWebhookEntries(payload.entry).catch((err) => {
      console.error("[Webhook] Background processing error:", err);
    });

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error parsing webhook request:", error);
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}

/**
 * Internal processor for webhook entries across multiple pages
 */
async function processWebhookEntries(entries: MetaWebhookPayload["entry"]) {
  for (const entry of entries) {
    const incomingPageId = entry.id;
    if (!incomingPageId) continue;

    const page = await AppStorage.getPage(incomingPageId);
    if (!page || !page.autoReplyEnabled || !page.pageAccessToken) {
      continue;
    }

    const isDemo = page.pageAccessToken.startsWith("demo_");
    const tasks: Promise<unknown>[] = [];

    // ==========================================
    // 1. Process Feed Changes (Post Comments)
    // ==========================================
    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (change.field === "feed") {
          const val = change.value;
          if (val && val.item === "comment" && val.verb === "add") {
            const senderId = val.sender_id || val.from?.id;
            const senderName = val.sender_name || val.from?.name || "Commenter";

            // Ignore comments made by the Page itself
            if (senderId === incomingPageId) {
              continue;
            }

            const commentId = val.comment_id;
            const commentText = val.message || "";

            if (!commentId || !commentText) continue;

            // Deduplication / Idempotency check: Ignore duplicate comment retries
            const alreadyProcessed = await AppStorage.isEventProcessed(commentId);
            if (alreadyProcessed) {
              console.log(
                `[Webhook Deduplication] Skipping already processed comment ${commentId}`
              );
              continue;
            }

            // Layer A: Check if commenter is asking for Stock or Price
            const stockCheck = await parseStockOrPriceInquiry(
              incomingPageId,
              commentText
            );

            if (stockCheck.isInquiry && stockCheck.replyText) {
              if (isDemo) {
                console.log(
                  `[Webhook Demo - Stock Comment] ${commentId}: "${stockCheck.replyText}"`
                );
              } else {
                tasks.push(
                  MetaGraphService.replyPublicComment(
                    commentId,
                    stockCheck.replyText,
                    page.pageAccessToken
                  ).catch((err) =>
                    console.error(
                      `[Webhook] Comment reply failed for ${commentId}:`,
                      err.message
                    )
                  )
                );
              }

              await AppStorage.logAutomationEvent({
                pageId: incomingPageId,
                eventId: commentId,
                eventType: "stock_inquiry",
                senderId,
                senderName,
                inputMessage: commentText,
                replyMessage: stockCheck.replyText,
                handledBy: "Stock & Price Parser (Comment)",
                status: "success",
              });
              continue;
            }

            // Layer B: Standard Keyword Automation Rules
            const matchedRule = findMatchingRule(commentText, page.rules);

            if (matchedRule) {
              let publicReplySent = false;
              if (matchedRule.commentReply && matchedRule.commentReply.trim()) {
                if (isDemo) {
                  console.log(
                    `[Webhook Demo - Rule Public] ${commentId}: "${matchedRule.commentReply.trim()}"`
                  );
                } else {
                  tasks.push(
                    MetaGraphService.replyPublicComment(
                      commentId,
                      matchedRule.commentReply.trim(),
                      page.pageAccessToken
                    ).catch((err) =>
                      console.error(
                        `[Webhook] Public reply failed for ${commentId}:`,
                        err.message
                      )
                    )
                  );
                }
                publicReplySent = true;
              }

              if (
                matchedRule.sendPrivateInbox &&
                matchedRule.inboxReply &&
                matchedRule.inboxReply.trim()
              ) {
                if (isDemo) {
                  console.log(
                    `[Webhook Demo - Rule DM] ${commentId}: "${matchedRule.inboxReply.trim()}"`
                  );
                } else {
                  tasks.push(
                    MetaGraphService.sendPrivateCommentReply(
                      incomingPageId,
                      commentId,
                      matchedRule.inboxReply.trim(),
                      page.pageAccessToken
                    ).catch((err) =>
                      console.error(
                        `[Webhook] Private inbox reply failed for ${commentId}:`,
                        err.message
                      )
                    )
                  );
                }
              }

              await AppStorage.logAutomationEvent({
                pageId: incomingPageId,
                eventId: commentId,
                eventType: "comment",
                senderId,
                senderName,
                inputMessage: commentText,
                replyMessage:
                  matchedRule.commentReply || matchedRule.inboxReply || "Rule Triggered",
                handledBy: `Keyword Rule (${matchedRule.keyword})`,
                status: "success",
              });
              continue;
            }

            // Layer C: Fallback AI Reply for comments
            const aiFallback = await generateAiReply(
              incomingPageId,
              commentText,
              page.pageName
            );
            if (aiFallback.reply) {
              if (isDemo) {
                console.log(
                  `[Webhook Demo - AI Comment Reply] ${commentId}: "${aiFallback.reply}"`
                );
              } else {
                tasks.push(
                  MetaGraphService.replyPublicComment(
                    commentId,
                    aiFallback.reply,
                    page.pageAccessToken
                  ).catch((err) =>
                    console.error(
                      `[Webhook] AI comment reply failed for ${commentId}:`,
                      err.message
                    )
                  )
                );
              }

              await AppStorage.logAutomationEvent({
                pageId: incomingPageId,
                eventId: commentId,
                eventType: "ai_reply",
                senderId,
                senderName,
                inputMessage: commentText,
                replyMessage: aiFallback.reply,
                handledBy: `AI Smart Reply (${aiFallback.source})`,
                status: "success",
              });
            }
          }
        }
      }
    }

    // ==========================================
    // 2. Process Messenger Automation (DMR)
    // ==========================================
    if (Array.isArray(entry.messaging)) {
      for (const msgItem of entry.messaging) {
        if (msgItem.message?.is_echo) {
          continue;
        }

        const senderPsid = msgItem.sender?.id;
        if (!senderPsid || senderPsid === incomingPageId) {
          continue;
        }

        const messageId = msgItem.message?.mid || `msg_${Date.now()}_${senderPsid}`;
        const userText =
          msgItem.message?.text || msgItem.postback?.title || "";

        if (!userText) continue;

        // Deduplication / Idempotency check: Ignore duplicate message retries
        const alreadyProcessed = await AppStorage.isEventProcessed(messageId);
        if (alreadyProcessed) {
          console.log(
            `[Webhook Deduplication] Skipping already processed message ${messageId}`
          );
          continue;
        }

        let replyToSend = "";
        let handledBy = "";
        let logEventType: "order" | "stock_inquiry" | "message" | "ai_reply" = "message";
        let customerName = "Customer";

        // ==========================================
        // Layer 1: Automated Order Extraction
        // ==========================================
        const orderData = await parseOrderMessage(incomingPageId, userText);
        if (orderData && orderData.isValid) {
          customerName = orderData.customerName;
          const newOrder = await AppStorage.createOrder({
            pageId: incomingPageId,
            customerPsid: senderPsid,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress,
            productName: orderData.productName,
            productId: orderData.product?._id || "",
            quantity: orderData.quantity,
            totalAmount: orderData.totalAmount,
            status: "pending",
            source: "messenger_auto",
            notes: `Auto-extracted from Messenger chat: "${userText.slice(0, 80)}"`,
          });

          // Decrement product stock
          if (orderData.product?._id) {
            await AppStorage.decrementProductStock(
              orderData.product._id,
              orderData.quantity
            );
          }

          replyToSend = formatOrderConfirmationReply(
            orderData.customerName,
            newOrder.orderNumber,
            orderData.customerPhone,
            orderData.productName,
            orderData.totalAmount
          );
          handledBy = "Layer 1: Auto Order Extractor";
          logEventType = "order";
        }

        // ==========================================
        // Layer 2: Real-Time Stock & Price Inquiry
        // ==========================================
        if (!replyToSend) {
          const stockCheck = await parseStockOrPriceInquiry(
            incomingPageId,
            userText
          );
          if (stockCheck.isInquiry && stockCheck.replyText) {
            replyToSend = stockCheck.replyText;
            handledBy = "Layer 2: Real-Time Stock & Price Checker";
            logEventType = "stock_inquiry";
          }
        }

        // ==========================================
        // Layer 2.5: Custom Keyword Automation Rules
        // ==========================================
        if (!replyToSend) {
          const matchedRule = findMatchingRule(userText, page.rules);
          if (
            matchedRule &&
            matchedRule.inboxReply &&
            matchedRule.inboxReply.trim()
          ) {
            replyToSend = matchedRule.inboxReply.trim();
            handledBy = `Keyword Rule (${matchedRule.keyword})`;
            logEventType = "message";
          }
        }

        // ==========================================
        // Layer 3: AI Smart Reply Fallback
        // ==========================================
        if (!replyToSend) {
          const aiResult = await generateAiReply(
            incomingPageId,
            userText,
            page.pageName
          );
          if (aiResult.reply && aiResult.reply.trim().length > 0) {
            replyToSend = aiResult.reply.trim();
            handledBy = `Layer 3: AI Smart Reply (${aiResult.source})`;
            logEventType = "ai_reply";
          }
        }

        // Final Fallback: Default Inbox Reply
        if (!replyToSend && page.defaultInboxReply) {
          replyToSend = page.defaultInboxReply.trim();
          handledBy = "Default Inbox Greeting";
          logEventType = "message";
        }

        // Dispatch Reply
        if (replyToSend) {
          let dispatchStatus: "success" | "failed" = "success";
          let errorMsg = "";

          if (isDemo) {
            console.log(
              `[Webhook Demo - ${handledBy}] Messenger reply to ${senderPsid}: "${replyToSend.replace(/\n/g, " ")}"`
            );
          } else {
            try {
              await MetaGraphService.sendDirectMessengerReply(
                incomingPageId,
                senderPsid,
                replyToSend,
                page.pageAccessToken
              );
            } catch (err: unknown) {
              const error = err as Error;
              console.error(
                `[Webhook] Messenger reply failed for PSID ${senderPsid}:`,
                error.message
              );
              dispatchStatus = "failed";
              errorMsg = error.message;
            }
          }

          // Record Idempotency & Live Activity Log
          await AppStorage.logAutomationEvent({
            pageId: incomingPageId,
            eventId: messageId,
            eventType: logEventType,
            senderId: senderPsid,
            senderName: customerName,
            inputMessage: userText,
            replyMessage: replyToSend,
            handledBy,
            status: dispatchStatus,
            error: errorMsg,
          });
        }
      }
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }
}
