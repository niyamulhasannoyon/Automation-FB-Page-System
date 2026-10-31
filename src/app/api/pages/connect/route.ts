import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { MetaGraphService } from "@/lib/meta-graph";
import { maskToken } from "@/lib/crypto";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageId, pageAccessToken } = body;

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: "Page ID and Page Access Token are required." },
        { status: 400 }
      );
    }

    const cleanPageId = String(pageId).trim();
    const cleanToken = String(pageAccessToken).trim();

    // 1. Verify credentials against Meta Graph API or simulate for demo tokens
    let metaProfile;
    const isDemoToken =
      cleanToken.startsWith("demo_") || cleanPageId.startsWith("demo_");

    if (isDemoToken) {
      metaProfile = {
        id: cleanPageId,
        name: `Demo Page ${cleanPageId.slice(-4)}`,
        picture: {
          data: {
            url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
          },
        },
      };
    } else {
      try {
        metaProfile = await MetaGraphService.verifyPageCredentials(
          cleanPageId,
          cleanToken
        );
      } catch (graphErr: unknown) {
        const err = graphErr as Error;
        return NextResponse.json(
          {
            error: `Meta Graph API Verification Failed: ${err.message}`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Automatically subscribe Page to our app webhook
    let isSubscribed = false;
    if (isDemoToken) {
      isSubscribed = true;
    } else {
      try {
        const subResult = await MetaGraphService.subscribePageToWebhook(
          cleanPageId,
          cleanToken
        );
        isSubscribed = subResult.success;
      } catch (subErr) {
        console.warn("Could not auto-subscribe page to webhook:", subErr);
        isSubscribed = false;
      }
    }

    // 3. Upsert page record in storage
    const pagePicture =
      metaProfile.picture?.data?.url ||
      `https://graph.facebook.com/v21.0/${cleanPageId}/picture?type=large`;

    const sessionUser = await getSessionUser(req);
    const userId = sessionUser?.userId || "user_demo";

    const updatedPage = await AppStorage.upsertPage({
      userId,
      pageId: cleanPageId,
      pageName: metaProfile.name,
      pagePicture,
      pageAccessToken: cleanToken,
      isWebhookSubscribed: isSubscribed,
    });

    const maskedPage = {
      ...updatedPage,
      pageAccessToken: maskToken(updatedPage.pageAccessToken),
    };

    return NextResponse.json(
      {
        message: "Facebook Page successfully connected and verified!",
        page: maskedPage,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/pages/connect:", error);
    const err = error as Error;
    return NextResponse.json(
      {
        error:
          err.message || "An unexpected error occurred while connecting the page.",
      },
      { status: 500 }
    );
  }
}
