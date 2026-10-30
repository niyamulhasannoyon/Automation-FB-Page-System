import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ScheduledPost from "@/models/ScheduledPost";
import ConnectedPage from "@/models/ConnectedPage";
import { MetaGraphService } from "@/lib/meta-graph";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const secretQuery = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secretQuery === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Unauthorized cron invocation." },
          { status: 401 }
        );
      }
    }

    await connectToDatabase();

    const now = new Date();
    // Find all pending posts whose scheduled time is now or in the past
    const pendingPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: now },
    })
      .sort({ scheduledTime: 1 })
      .limit(30);

    if (pendingPosts.length === 0) {
      return NextResponse.json({
        message: "No pending scheduled posts due for execution.",
        processed: 0,
      });
    }

    const results = {
      total: pendingPosts.length,
      published: 0,
      failed: 0,
      details: [] as Array<{
        id: string;
        pageId: string;
        status: string;
        error?: string;
      }>,
    };

    for (const post of pendingPosts) {
      try {
        const page = await ConnectedPage.findOne({ pageId: post.pageId });

        if (!page || !page.pageAccessToken) {
          post.status = "failed";
          post.errorLog =
            "Connected Facebook Page not found or access token missing.";
          await post.save();
          results.failed++;
          results.details.push({
            id: post._id.toString(),
            pageId: post.pageId,
            status: "failed",
            error: post.errorLog,
          });
          continue;
        }

        // Publish to Facebook via Meta Graph API
        const fbResult = await MetaGraphService.publishPost(
          post.pageId,
          post.caption,
          post.imageUrl,
          page.pageAccessToken
        );

        post.status = "published";
        post.fbPostId = fbResult.post_id || fbResult.id;
        post.errorLog = "";
        await post.save();

        results.published++;
        results.details.push({
          id: post._id.toString(),
          pageId: post.pageId,
          status: "published",
        });
      } catch (err: unknown) {
        const error = err as Error;
        post.status = "failed";
        post.errorLog = error.message;
        await post.save();

        results.failed++;
        results.details.push({
          id: post._id.toString(),
          pageId: post.pageId,
          status: "failed",
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      {
        message: `Cron job executed successfully. Published: ${results.published}, Failed: ${results.failed}`,
        results,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Cron worker error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Cron worker execution failed." },
      { status: 500 }
    );
  }
}
