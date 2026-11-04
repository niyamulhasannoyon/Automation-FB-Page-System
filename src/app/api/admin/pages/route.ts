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

    const pages = await AppStorage.getAllPagesAdmin();
    return NextResponse.json({ pages }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] pages GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch all pages." },
      { status: 500 }
    );
  }
}
