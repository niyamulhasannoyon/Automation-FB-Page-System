import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await AppStorage.getAutomationLogs(pageId, limit);
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /api/logs:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch automation logs." },
      { status: 500 }
    );
  }
}
