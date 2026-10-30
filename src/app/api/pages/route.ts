import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ConnectedPage from "@/models/ConnectedPage";

export async function GET() {
  try {
    await connectToDatabase();
    const pages = await ConnectedPage.find({}).sort({ updatedAt: -1 });

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
