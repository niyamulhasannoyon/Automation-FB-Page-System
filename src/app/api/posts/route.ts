import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { error: "Query parameter 'pageId' is required." },
        { status: 400 }
      );
    }

    const posts = await AppStorage.getPosts(pageId);

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /api/posts:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch posts." },
      { status: 500 }
    );
  }
}
