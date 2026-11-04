import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId") || undefined;
    const eventType = searchParams.get("eventType") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const logs = await AppStorage.getGlobalAutomationLogsAdmin({
      pageId,
      eventType,
      status,
      search,
      limit,
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] logs GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch logs." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const clearedCount = await AppStorage.clearAutomationLogsAdmin();
    return NextResponse.json(
      { message: `Successfully cleared ${clearedCount} automation logs.` },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] logs DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear logs." },
      { status: 500 }
    );
  }
}
