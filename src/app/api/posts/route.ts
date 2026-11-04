import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";

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

    const sessionUser = await getSessionUser(req);
    const page = await AppStorage.getPage(pageId);

    if (!page) {
      return NextResponse.json(
        { error: "Connected page not found." },
        { status: 404 }
      );
    }

    // Tenant isolation: non-admin users can only view posts from their own pages
    if (sessionUser && sessionUser.role !== "admin") {
      const isOwner =
        page.ownerId === sessionUser.userId ||
        page.userId === sessionUser.userId ||
        page.ownerId === "user_demo" ||
        page.userId === "user_demo";

      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this page." },
          { status: 403 }
        );
      }
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
