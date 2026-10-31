import { NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";

export async function GET() {
  try {
    const pages = await AppStorage.getAllPages();
    return NextResponse.json({ pages }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /api/pages:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch connected pages." },
      { status: 500 }
    );
  }
}
