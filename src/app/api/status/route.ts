import { NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";

export async function GET() {
  const isFallback = AppStorage.isFallbackActive();
  const pages = await AppStorage.getAllPages();

  return NextResponse.json(
    {
      status: "operational",
      version: "1.0.0",
      graphApiVersion: "v21.0",
      storage: {
        mode: isFallback ? "local_persistent_store" : "mongodb_active",
        location: isFallback ? ".data/db.json" : "MongoDB Connection Pool",
        connectedPages: pages.length,
      },
      endpoints: {
        webhook: "/api/webhook",
        cronPublish: "/api/cron/publish",
        pages: "/api/pages",
        posts: "/api/posts",
        orders: "/api/orders",
        products: "/api/products",
        database: "/api/settings/database",
      },
    },
    { status: 200 }
  );
}
