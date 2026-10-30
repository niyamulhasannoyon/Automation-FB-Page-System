import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ConnectedPage from "@/models/ConnectedPage";
import ScheduledPost from "@/models/ScheduledPost";
import { MetaGraphService } from "@/lib/meta-graph";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageId, caption, imageUrl, scheduledTime } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "Page ID is required." },
        { status: 400 }
      );
    }

    if (!caption && !imageUrl) {
      return NextResponse.json(
        { error: "Please provide either a caption or an image URL." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const page = await ConnectedPage.findOne({ pageId });
    if (!page) {
      return NextResponse.json(
        { error: "Connected page not found in database." },
        { status: 404 }
      );
    }

    // Determine if this is a scheduled post or instant publish
    const isScheduled =
      scheduledTime && new Date(scheduledTime).getTime() > Date.now() + 60000; // at least 1 minute in future

    if (isScheduled) {
      const scheduledDate = new Date(scheduledTime);

      const newScheduledPost = await ScheduledPost.create({
        pageId,
        caption: caption || "",
        imageUrl: imageUrl || "",
        scheduledTime: scheduledDate,
        status: "pending",
      });

      return NextResponse.json(
        {
          message: "Post successfully scheduled!",
          post: newScheduledPost,
          isScheduled: true,
        },
        { status: 201 }
      );
    } else {
      // Instant Publish to Facebook Page via Meta Graph API
      let fbResult;
      try {
        fbResult = await MetaGraphService.publishPost(
          pageId,
          caption || "",
          imageUrl || undefined,
          page.pageAccessToken
        );
      } catch (fbErr: unknown) {
        const err = fbErr as Error;
        // Also save failed attempt to post history
        await ScheduledPost.create({
          pageId,
          caption: caption || "",
          imageUrl: imageUrl || "",
          scheduledTime: new Date(),
          status: "failed",
          errorLog: err.message,
        });

        return NextResponse.json(
          { error: `Facebook Graph API Error: ${err.message}` },
          { status: 502 }
        );
      }

      const publishedPost = await ScheduledPost.create({
        pageId,
        caption: caption || "",
        imageUrl: imageUrl || "",
        scheduledTime: new Date(),
        status: "published",
        fbPostId: fbResult.post_id || fbResult.id,
      });

      return NextResponse.json(
        {
          message: "Post published to Facebook successfully!",
          post: publishedPost,
          isScheduled: false,
          fbPostId: publishedPost.fbPostId,
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in /api/posts/publish:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to process post request." },
      { status: 500 }
    );
  }
}
