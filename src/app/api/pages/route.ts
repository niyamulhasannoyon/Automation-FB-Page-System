import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { maskToken } from "@/lib/crypto";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const userId = sessionUser?.userId;

    const pages = await AppStorage.getAllPages(userId);

    // Security: Always mask page access tokens before sending to frontend
    const maskedPages = pages.map((page) => ({
      ...page,
      pageAccessToken: maskToken(page.pageAccessToken),
    }));

    return NextResponse.json({ pages: maskedPages }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /api/pages:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch connected pages." },
      { status: 500 }
    );
  }
}
