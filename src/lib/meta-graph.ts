import { MetaPageProfile } from "@/types";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class MetaGraphService {
  /**
   * Verify Page ID and Access Token, fetching the Page Name and Picture URL
   */
  static async verifyPageCredentials(
    pageId: string,
    pageAccessToken: string
  ): Promise<MetaPageProfile> {
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(
      pageId
    )}?fields=name,picture.type(large)&access_token=${encodeURIComponent(
      pageAccessToken
    )}`;

    const res = await fetch(url, {
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
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/subscribed_apps`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: ["feed", "messages", "messaging_postbacks"],
        access_token: pageAccessToken,
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
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(commentId)}/comments`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken,
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
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
        messaging_type: "RESPONSE",
        access_token: pageAccessToken,
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
    const url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: message },
        messaging_type: "RESPONSE",
        access_token: pageAccessToken,
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
    let url: string;
    let payload: Record<string, unknown>;

    if (imageUrl && imageUrl.trim().length > 0) {
      // Photo Post
      url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/photos`;
      payload = {
        url: imageUrl.trim(),
        caption: caption || "",
        access_token: pageAccessToken,
      };
    } else {
      // Status / Text Post
      url = `${GRAPH_BASE_URL}/${encodeURIComponent(pageId)}/feed`;
      payload = {
        message: caption || "",
        access_token: pageAccessToken,
      };
    }

    const res = await fetch(url, {
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
