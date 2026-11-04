import { NextRequest, NextResponse } from "next/server";
import { MetaGraphService } from "@/lib/meta-graph";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, pageId } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "Token is required for inspection." },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const cleanPageId = pageId ? String(pageId).trim() : undefined;

    // Run Meta Graph Token Inspection
    const inspection = await MetaGraphService.debugToken(cleanToken);

    const hasAppCredentials = Boolean(
      process.env.META_APP_ID && process.env.META_APP_SECRET
    );

    const requiredScopes = [
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_messaging",
    ];

    const missingCrucialScopes = requiredScopes.filter(
      (scope) => !inspection.scopes.includes(scope)
    );

    let recommendation = "";
    if (cleanToken.startsWith("demo_")) {
      recommendation = "Demo Token active. Simulates permanent connection for local development and testing.";
    } else if (inspection.isPermanent) {
      if (inspection.tokenType === "system_user") {
        recommendation = "System User Permanent Token detected. Never expires! Perfect for 24/7 uninterrupted automation.";
      } else {
        recommendation = "Permanent Page Access Token detected (never expires). Uninterrupted automation guaranteed.";
      }
    } else if (!inspection.isValid) {
      recommendation = "Token is invalid or has expired. Please generate a new System User Token with 'Never' expiry or use Graph API Explorer.";
    } else {
      // Short-lived token
      if (hasAppCredentials && cleanPageId) {
        recommendation = "Short-lived token (~1-2 hours) detected. AutoPage can automatically exchange this for a Permanent Page Access Token when connecting!";
      } else if (hasAppCredentials) {
        recommendation = "Short-lived token detected. Provide Page ID during connect, and AutoPage will automatically convert it into a Permanent Token.";
      } else {
        recommendation = "Short-lived token detected (expires in ~1-2 hours). For permanent automation, create a System User in Meta Business Suite with 'Never' expiry, or add META_APP_ID & META_APP_SECRET to .env for automatic exchange.";
      }
    }

    return NextResponse.json(
      {
        inspection,
        canAutoUpgrade: hasAppCredentials,
        missingCrucialScopes,
        recommendation,
        isPermanent: inspection.isPermanent,
        tokenType: inspection.tokenType,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/pages/token-inspect:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to inspect access token." },
      { status: 500 }
    );
  }
}
