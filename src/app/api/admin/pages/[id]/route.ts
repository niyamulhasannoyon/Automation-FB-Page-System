import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";
import { MetaGraphService } from "@/lib/meta-graph";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    // Check if re-subscribe webhook was requested
    if (body.action === "resubscribe") {
      const page = await AppStorage.getPage(id);
      if (!page) {
        return NextResponse.json({ error: "Page not found." }, { status: 404 });
      }

      const resubResult = await MetaGraphService.subscribePageToWebhook(
        page.pageId,
        page.pageAccessToken
      );
      const isSubscribed = Boolean(resubResult.success);

      await AppStorage.updatePage(page.pageId, {
        isWebhookSubscribed: isSubscribed,
      });

      return NextResponse.json(
        {
          message: isSubscribed
            ? "Webhook successfully re-subscribed with Meta Graph API!"
            : "Meta returned non-success response on subscription. Check token permissions.",
          isWebhookSubscribed: isSubscribed,
        },
        { status: 200 }
      );
    }

    const updated = await AppStorage.updatePage(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Page not found or update failed." }, { status: 404 });
    }

    return NextResponse.json({ message: "Page updated successfully.", page: updated }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] page PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update page." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const success = await AppStorage.deletePage(id);

    if (!success) {
      return NextResponse.json({ error: "Page not found or delete failed." }, { status: 404 });
    }

    return NextResponse.json({ message: "Page disconnected successfully." }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] page DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete page." },
      { status: 500 }
    );
  }
}
