import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ConnectedPage from "@/models/ConnectedPage";
import ScheduledPost from "@/models/ScheduledPost";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pages/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const page = await ConnectedPage.findOne({
      $or: [{ pageId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json({ page }, { status: 200 });
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

    await connectToDatabase();

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

    const updatedPage = await ConnectedPage.findOneAndUpdate(
      {
        $or: [{ pageId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedPage) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Page settings updated successfully.", page: updatedPage },
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
    await connectToDatabase();

    const page = await ConnectedPage.findOneAndDelete({
      $or: [{ pageId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    // Clean up related scheduled posts
    await ScheduledPost.deleteMany({ pageId: page.pageId });

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
