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

    const orders = await AppStorage.getAllOrdersAdmin();
    return NextResponse.json({ orders }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] orders GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
