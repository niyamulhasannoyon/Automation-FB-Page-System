import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ConnectedPage from "@/models/ConnectedPage";
import { MetaGraphService } from "@/lib/meta-graph";

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

    // 1. Verify credentials against Meta Graph API
    let metaProfile;
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

    // 2. Automatically subscribe Page to our app webhook
    let isSubscribed = false;
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

    // 3. Connect to Database and upsert page record
    await connectToDatabase();

    const pagePicture =
      metaProfile.picture?.data?.url ||
      `https://graph.facebook.com/v21.0/${cleanPageId}/picture?type=large`;

    const updatedPage = await ConnectedPage.findOneAndUpdate(
      { pageId: cleanPageId },
      {
        $set: {
          pageName: metaProfile.name,
          pagePicture: pagePicture,
          pageAccessToken: cleanToken,
          isWebhookSubscribed: isSubscribed,
        },
        $setOnInsert: {
          autoReplyEnabled: true,
          defaultInboxReply:
            "Hello! Thanks for reaching out. We received your message and will get back to you shortly.",
          rules: [],
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "Facebook Page successfully connected and verified!",
        page: updatedPage,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/pages/connect:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while connecting the page." },
      { status: 500 }
    );
  }
}
