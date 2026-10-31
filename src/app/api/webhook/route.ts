import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { MetaGraphService } from "@/lib/meta-graph";
import { findMatchingRule } from "@/lib/utils";
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
              const matchedRule = findMatchingRule(commentText, page.rules);

              const isDemo = page.pageAccessToken.startsWith("demo_");

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

    // 2. Process Messenger Automation
    if (Array.isArray(entry.messaging)) {
      const isDemo = page.pageAccessToken.startsWith("demo_");
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

        if (userText) {
          const matchedRule = findMatchingRule(userText, page.rules);

          if (matchedRule && matchedRule.inboxReply && matchedRule.inboxReply.trim()) {
            if (isDemo) {
              console.log(
                `[Webhook Demo] Simulated Messenger rule reply to PSID ${senderPsid}: "${matchedRule.inboxReply.trim()}"`
              );
            } else {
              tasks.push(
                MetaGraphService.sendDirectMessengerReply(
                  incomingPageId,
                  senderPsid,
                  matchedRule.inboxReply.trim(),
                  page.pageAccessToken
                ).catch((err) =>
                  console.error(
                    `[Webhook] Messenger rule reply failed for PSID ${senderPsid}:`,
                    err.message
                  )
                )
              );
            }
          } else if (
            page.defaultInboxReply &&
            page.defaultInboxReply.trim().length > 0
          ) {
            if (isDemo) {
              console.log(
                `[Webhook Demo] Simulated Messenger fallback reply to PSID ${senderPsid}: "${page.defaultInboxReply.trim()}"`
              );
            } else {
              tasks.push(
                MetaGraphService.sendDirectMessengerReply(
                  incomingPageId,
                  senderPsid,
                  page.defaultInboxReply.trim(),
                  page.pageAccessToken
                ).catch((err) =>
                  console.error(
                    `[Webhook] Messenger default fallback reply failed for PSID ${senderPsid}:`,
                    err.message
                  )
                )
              );
            }
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
