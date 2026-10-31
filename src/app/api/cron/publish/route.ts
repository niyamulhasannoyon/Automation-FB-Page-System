import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
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

    const now = new Date();
    // Find all pending posts whose scheduled time is now or in the past
    const pendingPosts = await AppStorage.getPendingPostsDue(now);

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
      const postId = post._id || "";
      try {
        const page = await AppStorage.getPage(post.pageId);

        if (!page || !page.pageAccessToken) {
          await AppStorage.updatePost(postId, {
            status: "failed",
            errorLog: "Connected Facebook Page not found or access token missing.",
          });
          results.failed++;
          results.details.push({
            id: postId,
            pageId: post.pageId,
            status: "failed",
            error: "Connected Facebook Page not found or access token missing.",
          });
          continue;
        }

        // Publish to Facebook via Meta Graph API (or simulated for demo tokens)
        let fbResult: { id: string; post_id?: string };
        const isDemo = page.pageAccessToken.startsWith("demo_");

        if (isDemo) {
          fbResult = {
            id: `cron_demo_${Date.now()}`,
            post_id: `${post.pageId}_cron_${Date.now()}`,
          };
        } else {
          fbResult = await MetaGraphService.publishPost(
            post.pageId,
            post.caption,
            post.imageUrl,
            page.pageAccessToken
          );
        }

        await AppStorage.updatePost(postId, {
          status: "published",
          fbPostId: fbResult.post_id || fbResult.id,
          errorLog: "",
        });

        results.published++;
        results.details.push({
          id: postId,
          pageId: post.pageId,
          status: "published",
        });
      } catch (err: unknown) {
        const error = err as Error;
        await AppStorage.updatePost(postId, {
          status: "failed",
          errorLog: error.message,
        });

        results.failed++;
        results.details.push({
          id: postId,
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
