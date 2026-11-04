import { MetaPageProfile } from "@/types";
import { decryptToken } from "./crypto";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Checks if a Meta Graph API error or HTTP status indicates rate limiting or a transient issue
 */
function isRateLimitOrTransient(status: number, data: any): boolean {
  if (status === 429) return true;
  const errorCode = data?.error?.code;
  const isTransient = data?.error?.is_transient;
  // Meta rate limit error codes: 4 (App limit), 17 (User limit), 32 (Page limit), 613 (Calls limit)
  if (errorCode === 4 || errorCode === 17 || errorCode === 32 || errorCode === 613) {
    return true;
  }
  return Boolean(isTransient);
}

/**
 * Helper to fetch with exponential backoff on rate limits
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        return res;
      }

      // Check if it's rate limited or transient
      let data: any = null;
      try {
        const cloned = res.clone();
        data = await cloned.json();
      } catch {
        // Not JSON
      }

      if (attempt < maxRetries && isRateLimitOrTransient(res.status, data)) {
        attempt++;
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(
          `[MetaGraph] Rate limit encountered (${res.status} code:${data?.error?.code}). Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delayMs)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return res;
    } catch (err: unknown) {
      if (attempt < maxRetries) {
        attempt++;
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(
          `[MetaGraph] Network error. Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delayMs)}ms...`,
          err
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

export class MetaGraphService {
  /**
   * Verify Page ID and Access Token, fetching the Page Name and Picture URL
   */
  static async verifyPageCredentials(
    pageId: string,
    pageAccessToken: string
  ): Promise<MetaPageProfile> {
    const rawToken = decryptToken(pageAccessToken);
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(
      pageId
    )}?fields=name,picture.type(large)&access_token=${encodeURIComponent(
      rawToken
    )}`;

    const res = await fetchWithBackoff(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorMsg =
        data.error?.message ||
        `Failed to verify Facebook Page (HTTP ${res.status})`;
      throw new Error(errorMsg);
    }

    return data as MetaPageProfile;
  }

  /**
   * Subscribe page to our app's webhooks for feed and messenger events
   */
  static async subscribePageToWebhook(
    pageId: string,
    pageAccessToken: string
  ): Promise<{ success: boolean }> {
    const rawToken = decryptToken(pageAccessToken);
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/subscribed_apps`;

    const res = await fetchWithBackoff(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: ["feed", "messages", "messaging_postbacks"],
        access_token: rawToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.warn(
        `Webhook auto-subscribe warning for page ${pageId}:`,
        data.error?.message || data
      );
      // Return false instead of failing connection if app lacks permission or is in dev mode
      return { success: false };
    }

    return { success: Boolean(data.success) };
  }

  /**
   * Reply publicly to a comment on a page post
   */
  static async replyPublicComment(
    commentId: string,
    message: string,
    pageAccessToken: string
  ): Promise<{ id: string }> {
    const rawToken = decryptToken(pageAccessToken);
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(commentId)}/comments`;

    const res = await fetchWithBackoff(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: rawToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        data.error?.message || `Failed to reply to comment ${commentId}`
      );
    }

    return data;
  }

  /**
   * Send a private inbox message to a commenter using their comment_id
   * (Meta Graph API Private Reply feature)
   */
  static async sendPrivateCommentReply(
    pageId: string,
    commentId: string,
    message: string,
    pageAccessToken: string
  ): Promise<{ recipient_id: string; message_id: string }> {
    const rawToken = decryptToken(pageAccessToken);
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/messages`;

    const res = await fetchWithBackoff(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
        messaging_type: "RESPONSE",
        access_token: rawToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        data.error?.message ||
          `Failed to send private reply for comment ${commentId}`
      );
    }

    return data;
  }

  /**
   * Send a direct Messenger reply to a user PSID
   */
  static async sendDirectMessengerReply(
    pageId: string,
    recipientPsid: string,
    message: string,
    pageAccessToken: string
  ): Promise<{ recipient_id: string; message_id: string }> {
    const rawToken = decryptToken(pageAccessToken);
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/messages`;

    const res = await fetchWithBackoff(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: message },
        messaging_type: "RESPONSE",
        access_token: rawToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        data.error?.message ||
          `Failed to send direct messenger reply to ${recipientPsid}`
      );
    }

    return data;
  }

  /**
   * Publish a post to a Page's feed or photo stream
   */
  static async publishPost(
    pageId: string,
    caption: string,
    imageUrl: string | undefined,
    pageAccessToken: string
  ): Promise<{ id: string; post_id?: string }> {
    const rawToken = decryptToken(pageAccessToken);
    let url: string;
    let payload: Record<string, unknown>;

    if (imageUrl && imageUrl.trim().length > 0) {
      // Photo Post
      url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/photos`;
      payload = {
        url: imageUrl.trim(),
        caption: caption || "",
        access_token: rawToken,
      };
    } else {
      // Status / Text Post
      url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/feed`;
      payload = {
        message: caption || "",
        access_token: rawToken,
      };
    }

    const res = await fetchWithBackoff(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        data.error?.message || `Failed to publish post to page ${pageId}`
      );
    }

    return data;
  }
}
