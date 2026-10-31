import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const action = searchParams.get("action");

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/facebook`;

  // 1. Status query: frontend checking if Meta App is configured
  if (action === "status") {
    return NextResponse.json({
      isConfigured: Boolean(appId && appSecret),
      appId: appId || null,
      redirectUri,
    });
  }

  // 2. Start Meta OAuth Flow
  if (action === "login") {
    if (!appId || !appSecret) {
      return NextResponse.json(
        {
          error:
            "META_APP_ID and META_APP_SECRET are not configured in .env. Use Manual Token (BYOT) or One-Click Demo Connect.",
        },
        { status: 400 }
      );
    }

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,pages_messaging&response_type=code`;

    return NextResponse.redirect(oauthUrl);
  }

  // 3. Callback from Meta with ?code=...
  if (code) {
    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL("/?error=Meta+App+credentials+missing", req.url)
      );
    }

    try {
      // Exchange code for user access token
      const tokenExchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code=${code}`;

      const tokenRes = await fetch(tokenExchangeUrl);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error?.message || "Failed to exchange OAuth code.");
      }

      const userAccessToken = tokenData.access_token;

      // Fetch user's managed Facebook Pages and their Page Access Tokens
      const accountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,access_token&access_token=${userAccessToken}`
      );
      const accountsData = await accountsRes.json();

      if (!accountsRes.ok || !Array.isArray(accountsData.data)) {
        throw new Error("Could not retrieve Facebook Pages from Meta Graph API.");
      }

      const sessionUser = await getSessionUser(req);
      const userId = sessionUser?.userId || "user_demo";

      // Connect each page
      for (const pageItem of accountsData.data) {
        await AppStorage.upsertPage({
          userId,
          pageId: pageItem.id,
          pageName: pageItem.name,
          pagePicture: pageItem.picture?.data?.url || "",
          pageAccessToken: pageItem.access_token,
          isWebhookSubscribed: true,
        });
      }

      return NextResponse.redirect(
        new URL("/?connected=oauth_success", req.url)
      );
    } catch (err: unknown) {
      const error = err as Error;
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, req.url)
      );
    }
  }

  return NextResponse.json({
    message: "Meta Facebook OAuth API Route",
    isConfigured: Boolean(appId && appSecret),
  });
}

/**
 * POST /api/auth/facebook: Simulated OAuth connect for sandbox or evaluation
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const userId = sessionUser?.userId || "user_demo";

    const demoPageId = `fb_page_${Date.now().toString().slice(-6)}`;
    const newPage = await AppStorage.upsertPage({
      userId,
      pageId: demoPageId,
      pageName: `FastStore Digital (OAuth)`,
      pagePicture:
        "https://images.unsplash.com/photo-1556742049-0a67e5572293?w=150&auto=format&fit=crop&q=80",
      pageAccessToken: `demo_oauth_token_${Date.now()}`,
      isWebhookSubscribed: true,
    });

    return NextResponse.json(
      {
        message: "Successfully connected Facebook Page via OAuth!",
        page: newPage,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
