import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { MetaGraphService } from "@/lib/meta-graph";
import { findMatchingRule } from "@/lib/utils";
import {
  parseOrderMessage,
  parseStockOrPriceInquiry,
  formatOrderConfirmationReply,
} from "@/lib/order-parser";
import { generateAiSalesmanReply } from "@/lib/ai-salesman";
import { MetaWebhookPayload } from "@/types";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "fb_auto_verify_token_secure_2025";

/**
 * GET /api/webhook
 * Handles Meta Graph API Webhook Challenge Verification
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
 * Multi-Tenant Meta Webhook Event Processor for Comments & Messenger
 * Powered by 3-Layer Intelligence (Order Extraction, Stock Checker, AI Salesman)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MetaWebhookPayload;

    if (payload.object !== "page" || !Array.isArray(payload.entry)) {
      return NextResponse.json({ status: "IGNORED_NOT_PAGE" }, { status: 200 });
    }

    // Process asynchronously so Meta receives a 200 response immediately
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

    // 1. Process Feed Changes (Post Comments)
    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (change.field === "feed") {
          const val = change.value;
          // Check for new user comments
          if (val && val.item === "comment" && val.verb === "add") {
            const senderId = val.sender_id || val.from?.id;
            // Ignore comments made by the Page itself
            if (senderId === incomingPageId) {
              continue;
            }

            const commentId = val.comment_id;
            const commentText = val.message || "";

            if (commentId && commentText) {
              // Priority 1: Check if commenter is asking for Stock or Price
              const stockCheck = await parseStockOrPriceInquiry(
                incomingPageId,
                commentText
              );

              if (stockCheck.isInquiry && stockCheck.replyText) {
                if (isDemo) {
                  console.log(
                    `[Webhook Demo - Stock/Price Comment Reply] comment ${commentId}: "${stockCheck.replyText}"`
                  );
                } else {
                  tasks.push(
                    MetaGraphService.replyPublicComment(
                      commentId,
                      stockCheck.replyText,
                      page.pageAccessToken
                    ).catch((err) =>
                      console.error(
                        `[Webhook] Public reply failed for comment ${commentId}:`,
                        err.message
                      )
                    )
                  );
                }
                continue;
              }

              // Priority 2: Standard Keyword Automation Rules
              const matchedRule = findMatchingRule(commentText, page.rules);

              if (matchedRule) {
                // Public Comment Reply
                if (matchedRule.commentReply && matchedRule.commentReply.trim()) {
                  if (isDemo) {
                    console.log(
                      `[Webhook Demo] Simulated public reply to comment ${commentId}: "${matchedRule.commentReply.trim()}"`
                    );
                  } else {
                    tasks.push(
                      MetaGraphService.replyPublicComment(
                        commentId,
                        matchedRule.commentReply.trim(),
                        page.pageAccessToken
                      ).catch((err) =>
                        console.error(
                          `[Webhook] Public reply failed for comment ${commentId}:`,
                          err.message
                        )
                      )
                    );
                  }
                }

                // Private Message Reply
                if (
                  matchedRule.sendPrivateInbox &&
                  matchedRule.inboxReply &&
                  matchedRule.inboxReply.trim()
                ) {
                  if (isDemo) {
                    console.log(
                      `[Webhook Demo] Simulated private DM to comment ${commentId}: "${matchedRule.inboxReply.trim()}"`
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
                          `[Webhook] Private inbox reply failed for comment ${commentId}:`,
                          err.message
                        )
                      )
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    // 2. Process Messenger Automation with 3-Layer Pipeline
    if (Array.isArray(entry.messaging)) {
      for (const msgItem of entry.messaging) {
        // Skip echo messages sent by the page/app
        if (msgItem.message?.is_echo) {
          continue;
        }

        const senderPsid = msgItem.sender?.id;
        if (!senderPsid || senderPsid === incomingPageId) {
          continue;
        }

        const userText =
          msgItem.message?.text || msgItem.postback?.title || "";

        if (!userText) continue;

        let replyToSend = "";
        let handledBy = "";

        // ==========================================
        // Layer 1: Automated Order Extraction
        // ==========================================
        const orderData = await parseOrderMessage(incomingPageId, userText);
        if (orderData && orderData.isValid) {
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

          // Decrement product stock if matched
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
            handledBy = "Automation Rules";
          }
        }

        // ==========================================
        // Layer 3: Gemini AI Smart Salesman Fallback
        // ==========================================
        if (!replyToSend) {
          const aiResult = await generateAiSalesmanReply(
            incomingPageId,
            userText,
            page.pageName
          );
          if (aiResult.reply && aiResult.reply.trim().length > 0) {
            replyToSend = aiResult.reply.trim();
            handledBy = `Layer 3: Gemini AI Salesman (${aiResult.source})`;
          }
        }

        // Final Fallback: Default Inbox Reply
        if (!replyToSend && page.defaultInboxReply) {
          replyToSend = page.defaultInboxReply.trim();
          handledBy = "Default Inbox Greeting";
        }

        // Dispatch Reply
        if (replyToSend) {
          if (isDemo) {
            console.log(
              `[Webhook Demo - ${handledBy}] Messenger reply to PSID ${senderPsid}: "${replyToSend.replace(/\n/g, " ")}"`
            );
          } else {
            tasks.push(
              MetaGraphService.sendDirectMessengerReply(
                incomingPageId,
                senderPsid,
                replyToSend,
                page.pageAccessToken
              ).catch((err) =>
                console.error(
                  `[Webhook] Messenger reply failed for PSID ${senderPsid}:`,
                  err.message
                )
              )
            );
          }
        }
      }
    }

    // Wait for all non-blocking actions for this page to settle
    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }
}
