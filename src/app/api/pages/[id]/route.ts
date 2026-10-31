import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { maskToken } from "@/lib/crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pages/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const page = await AppStorage.getPage(id);

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    // Security: Mask pageAccessToken before returning to frontend
    const maskedPage = {
      ...page,
      pageAccessToken: maskToken(page.pageAccessToken),
    };

    return NextResponse.json({ page: maskedPage }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/pages/[id] - Update settings, toggle automation, or update rules
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedUpdates = [
      "autoReplyEnabled",
      "defaultInboxReply",
      "rules",
      "isWebhookSubscribed",
    ];

    const updatePayload: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    const updatedPage = await AppStorage.updatePage(id, updatePayload);

    if (!updatedPage) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const maskedPage = {
      ...updatedPage,
      pageAccessToken: maskToken(updatedPage.pageAccessToken),
    };

    return NextResponse.json(
      { message: "Page settings updated successfully.", page: maskedPage },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating page:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/pages/[id] - Disconnect page and clear its scheduled posts
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await AppStorage.deletePage(id);

    if (!success) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Page and associated post schedules removed successfully." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting page:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
