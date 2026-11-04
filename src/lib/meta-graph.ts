import { MetaPageProfile, TokenInspectionResult, TokenType } from "@/types";
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
   * Inspect and debug an access token using Meta Graph API debug_token endpoint
   */
  static async debugToken(inputToken: string): Promise<TokenInspectionResult> {
    const rawToken = decryptToken(inputToken).trim();

    if (!rawToken) {
      return {
        isValid: false,
        tokenType: "unknown",
        isPermanent: false,
        expiresAt: null,
        expiresInSeconds: null,
        scopes: [],
        error: "Access token is empty.",
      };
    }

    // Demo token detection
    if (rawToken.startsWith("demo_")) {
      return {
        isValid: true,
        tokenType: "demo",
        isPermanent: true,
        expiresAt: null,
        expiresInSeconds: null,
        scopes: [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
          "pages_messaging",
        ],
      };
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    // Use App Access Token if configured, or the inputToken itself as fallback
    const debugAuthToken =
      appId && appSecret ? `${appId}|${appSecret}` : rawToken;

    const url = `${GRAPH_BASE_URL}/debug_token?input_token=${encodeURIComponent(
      rawToken
    )}&access_token=${encodeURIComponent(debugAuthToken)}`;

    try {
      const res = await fetchWithBackoff(url, { method: "GET" });
      const data = await res.json();

      if (!res.ok || data.error) {
        return await this.fallbackTokenInspection(rawToken);
      }

      const info = data.data;
      if (!info || info.is_valid === false) {
        return {
          isValid: false,
          tokenType: "unknown",
          isPermanent: false,
          expiresAt: null,
          expiresInSeconds: null,
          scopes: [],
          error:
            info?.error?.message ||
            data.error?.message ||
            "Access token is invalid or expired.",
        };
      }

      const metaType = String(info.type || "").toUpperCase();
      const rawExpiresAt = Number(info.expires_at || 0);
      const isNeverExpires = rawExpiresAt === 0;

      let tokenType: TokenType = "unknown";
      if (metaType === "SYSTEM_USER") {
        tokenType = "system_user";
      } else if (metaType === "PAGE") {
        tokenType = isNeverExpires ? "page_permanent" : "short_lived";
      } else if (metaType === "USER") {
        tokenType = isNeverExpires ? "system_user" : "user";
      }

      let expiresAt: string | null = null;
      let expiresInSeconds: number | null = null;

      if (!isNeverExpires && rawExpiresAt > 0) {
        expiresAt = new Date(rawExpiresAt * 1000).toISOString();
        const nowSec = Math.floor(Date.now() / 1000);
        expiresInSeconds = Math.max(0, rawExpiresAt - nowSec);

        if (tokenType !== "system_user") {
          tokenType = expiresInSeconds > 86400 * 2 ? "long_lived" : "short_lived";
        }
      }

      const scopes = Array.isArray(info.scopes) ? info.scopes : [];

      return {
        isValid: true,
        tokenType,
        isPermanent: isNeverExpires,
        expiresAt,
        expiresInSeconds,
        issuedAt: info.issued_at
          ? new Date(info.issued_at * 1000).toISOString()
          : null,
        scopes,
        appId: info.app_id,
        userId: info.user_id,
        pageId: info.profile_id,
      };
    } catch (err: unknown) {
      console.warn(
        "[MetaGraph] debug_token call failed, attempting fallback inspection:",
        err
      );
      return await this.fallbackTokenInspection(rawToken);
    }
  }

  /**
   * Fallback token inspector querying /me and /me/permissions when /debug_token is restricted
   */
  private static async fallbackTokenInspection(
    rawToken: string
  ): Promise<TokenInspectionResult> {
    try {
      const meUrl = `${GRAPH_BASE_URL}/me?fields=id,name&access_token=${encodeURIComponent(
        rawToken
      )}`;
      const res = await fetchWithBackoff(meUrl, { method: "GET" });
      const meData = await res.json();

      if (!res.ok || meData.error) {
        return {
          isValid: false,
          tokenType: "unknown",
          isPermanent: false,
          expiresAt: null,
          expiresInSeconds: null,
          scopes: [],
          error: meData.error?.message || "Token verification failed.",
        };
      }

      let scopes: string[] = [];
      try {
        const permUrl = `${GRAPH_BASE_URL}/me/permissions?access_token=${encodeURIComponent(
          rawToken
        )}`;
        const permRes = await fetchWithBackoff(permUrl, { method: "GET" });
        const permData = await permRes.json();
        if (permRes.ok && Array.isArray(permData.data)) {
          scopes = permData.data
            .filter((p: any) => p.status === "granted")
            .map((p: any) => p.permission);
        }
      } catch {
        // Optional
      }

      return {
        isValid: true,
        tokenType: "unknown",
        isPermanent: false,
        expiresAt: null,
        expiresInSeconds: null,
        scopes,
        userId: meData.id,
        warning:
          "Token verified via /me, but expiry duration could not be inspected without META_APP_ID and META_APP_SECRET.",
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        isValid: false,
        tokenType: "unknown",
        isPermanent: false,
        expiresAt: null,
        expiresInSeconds: null,
        scopes: [],
        error: error.message,
      };
    }
  }

  /**
   * Exchange a short-lived user access token for a 60-day Long-Lived User Access Token
   */
  static async exchangeForLongLivedUserToken(
    shortLivedUserToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const rawToken = decryptToken(shortLivedUserToken).trim();
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error(
        "META_APP_ID and META_APP_SECRET must be configured in .env to exchange tokens for long-lived permanent tokens."
      );
    }

    const url = `${GRAPH_BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      appId
    )}&client_secret=${encodeURIComponent(
      appSecret
    )}&fb_exchange_token=${encodeURIComponent(rawToken)}`;

    const res = await fetchWithBackoff(url, { method: "GET" });
    const data = await res.json();

    if (!res.ok || data.error || !data.access_token) {
      throw new Error(
        data.error?.message ||
          "Failed to exchange token with Meta oauth/access_token."
      );
    }

    return {
      accessToken: data.access_token,
      expiresIn: Number(data.expires_in || 5184000), // ~60 days
    };
  }

  /**
   * Retrieve the Permanent Page Access Token using a Long-Lived User Access Token
   * Meta official policy: Page tokens obtained from long-lived user tokens do not expire (expires_at: 0)
   */
  static async fetchPermanentPageAccessToken(
    longLivedUserToken: string,
    pageId: string
  ): Promise<{ pageAccessToken: string; pageName?: string }> {
    const rawToken = decryptToken(longLivedUserToken).trim();

    // Approach 1: Directly request the specific Page's access_token
    const pageUrl = `${GRAPH_BASE_URL}/${encodeURIComponent(
      pageId
    )}?fields=access_token,name&access_token=${encodeURIComponent(rawToken)}`;

    const pageRes = await fetchWithBackoff(pageUrl, { method: "GET" });
    const pageData = await pageRes.json();

    if (pageRes.ok && pageData.access_token) {
      return {
        pageAccessToken: pageData.access_token,
        pageName: pageData.name,
      };
    }

    // Approach 2: Fall back to querying /me/accounts and matching the pageId
    const accountsUrl = `${GRAPH_BASE_URL}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(
      rawToken
    )}`;
    const accountsRes = await fetchWithBackoff(accountsUrl, { method: "GET" });
    const accountsData = await accountsRes.json();

    if (accountsRes.ok && Array.isArray(accountsData.data)) {
      const targetPage = accountsData.data.find(
        (p: any) => String(p.id) === String(pageId)
      );
      if (targetPage && targetPage.access_token) {
        return {
          pageAccessToken: targetPage.access_token,
          pageName: targetPage.name,
        };
      }
    }

    const errorMsg =
      pageData.error?.message ||
      accountsData.error?.message ||
      `User token does not have admin/management access to Facebook Page ID ${pageId}. Make sure the user is an admin of this page.`;
    throw new Error(errorMsg);
  }

  /**
   * High-Level Auto-Upgrade Engine:
   * Inspects incoming token. If it's short-lived, automatically exchanges it for a permanent
   * Long-Lived Page Access Token if Meta App credentials are available.
   * If it's already a System User Permanent Token, validates and preserves it.
   */
  static async resolveAndUpgradeToPermanentToken(
    inputToken: string,
    pageId: string
  ): Promise<{
    pageAccessToken: string;
    tokenType: TokenType;
    isPermanent: boolean;
    tokenExpiresAt: string | null;
    tokenScopes: string[];
    autoUpgraded: boolean;
    warning?: string;
    inspection: TokenInspectionResult;
  }> {
    const cleanToken = decryptToken(inputToken).trim();
    const cleanPageId = String(pageId).trim();

    // 1. Check demo token
    if (cleanToken.startsWith("demo_") || cleanPageId.startsWith("demo_")) {
      const demoInspection: TokenInspectionResult = {
        isValid: true,
        tokenType: "demo",
        isPermanent: true,
        expiresAt: null,
        expiresInSeconds: null,
        scopes: [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
          "pages_messaging",
        ],
      };
      return {
        pageAccessToken: cleanToken,
        tokenType: "demo",
        isPermanent: true,
        tokenExpiresAt: null,
        tokenScopes: demoInspection.scopes,
        autoUpgraded: false,
        inspection: demoInspection,
      };
    }

    // 2. Live Inspection
    const inspection = await this.debugToken(cleanToken);

    if (!inspection.isValid) {
      throw new Error(
        `Meta Token Verification Failed: ${
          inspection.error || "Invalid Access Token"
        }`
      );
    }

    // 3. If ALREADY permanent (e.g. System User Token with "Never" expiry or already permanent Page token)
    if (inspection.isPermanent) {
      return {
        pageAccessToken: cleanToken,
        tokenType: inspection.tokenType,
        isPermanent: true,
        tokenExpiresAt: null,
        tokenScopes: inspection.scopes,
        autoUpgraded: false,
        inspection,
      };
    }

    // 4. Token is short-lived or user-scoped. Attempt automatic exchange to permanent token!
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (appId && appSecret) {
      try {
        console.log(
          `[MetaGraph] Short-lived token detected (expires in ${inspection.expiresInSeconds}s). Attempting auto-upgrade to Permanent Page Access Token...`
        );
        // Step A: Exchange for long-lived user token
        const { accessToken: longLivedUserToken } =
          await this.exchangeForLongLivedUserToken(cleanToken);

        // Step B: Fetch permanent page token
        const { pageAccessToken: permanentPageToken } =
          await this.fetchPermanentPageAccessToken(
            longLivedUserToken,
            cleanPageId
          );

        // Step C: Verify new permanent token
        const upgradedInspection = await this.debugToken(permanentPageToken);

        console.log(
          `[MetaGraph] Auto-upgrade successful! Permanent Page Token acquired for page ${cleanPageId}. Permanent: ${upgradedInspection.isPermanent}`
        );

        return {
          pageAccessToken: permanentPageToken,
          tokenType: upgradedInspection.isPermanent
            ? "page_permanent"
            : upgradedInspection.tokenType,
          isPermanent: upgradedInspection.isPermanent,
          tokenExpiresAt: upgradedInspection.expiresAt,
          tokenScopes:
            upgradedInspection.scopes.length > 0
              ? upgradedInspection.scopes
              : inspection.scopes,
          autoUpgraded: true,
          inspection: upgradedInspection,
        };
      } catch (upgradeErr: unknown) {
        const err = upgradeErr as Error;
        console.warn(
          "[MetaGraph] Token auto-upgrade could not be completed, using original token with warning:",
          err.message
        );

        return {
          pageAccessToken: cleanToken,
          tokenType: inspection.tokenType,
          isPermanent: false,
          tokenExpiresAt: inspection.expiresAt,
          tokenScopes: inspection.scopes,
          autoUpgraded: false,
          warning: `Short-lived token detected (${
            inspection.expiresInSeconds
              ? Math.round(inspection.expiresInSeconds / 3600) + "h remaining"
              : "1-2h"
          }). Auto-upgrade notice: ${
            err.message
          }. For 24/7 permanent automation, use a System User Token with "Never" expiry.`,
          inspection,
        };
      }
    }

    // 5. App credentials missing in .env - return token with clear warning
    const remainingHours = inspection.expiresInSeconds
      ? `${(inspection.expiresInSeconds / 3600).toFixed(1)} hours`
      : "1-2 hours";

    return {
      pageAccessToken: cleanToken,
      tokenType: inspection.tokenType,
      isPermanent: false,
      tokenExpiresAt: inspection.expiresAt,
      tokenScopes: inspection.scopes,
      autoUpgraded: false,
      warning: `Short-Lived Token warning: This token expires in ~${remainingHours}. Auto-upgrade requires META_APP_ID and META_APP_SECRET in .env, or use a Meta Business System User Permanent Token with 'Never' expiration.`,
      inspection,
    };
  }

  /**
   * Helper to identify if an error from Meta indicates expired token (OAuth code 190)
   */
  static isTokenExpiredError(error: any): boolean {
    if (!error) return false;
    const code = error?.code || error?.error?.code;
    const subcode = error?.error_subcode || error?.error?.error_subcode;
    const message = String(error?.message || error?.error?.message || "");

    if (code === 190) return true;
    if (subcode === 463 || subcode === 467) return true;
    if (
      message.includes("Session has expired") ||
      message.includes("Error validating access token") ||
      message.includes("Invalid OAuth access token")
    ) {
      return true;
    }
    return false;
  }

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
