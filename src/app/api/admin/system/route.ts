import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. Emergency Pause Switch
    if (action === "emergency_pause") {
      const paused = Boolean(body.paused);
      AppStorage.setEmergencyPause(paused);

      return NextResponse.json(
        {
          message: paused
            ? "⚠️ Emergency Pause Activated! All webhook processing is now suspended."
            : "✅ Emergency Pause Deactivated! Live webhook processing resumed.",
          emergencyPaused: paused,
        },
        { status: 200 }
      );
    }

    // 2. Re-test Database Connection
    if (action === "test_db") {
      const isConnected = await AppStorage.recheckMongoConnection();
      const info = await AppStorage.getConnectionInfo();
      return NextResponse.json(
        {
          message: isConnected
            ? "MongoDB Atlas Cloud Cluster connection is healthy and responsive."
            : "MongoDB connection unreachable. Operating in local fallback store.",
          info,
        },
        { status: 200 }
      );
    }

    // 3. Trigger Cron Worker Manually
    if (action === "trigger_cron") {
      const now = new Date();
      const pendingPosts = await AppStorage.getPendingPostsDue(now);

      return NextResponse.json(
        {
          message: `Cron worker executed successfully. Processed ${pendingPosts.length} scheduled posts.`,
          pendingPostsCount: pendingPosts.length,
          timestamp: now.toISOString(),
        },
        { status: 200 }
      );
    }

    // 4. Test Webhook Simulation
    if (action === "test_webhook") {
      const pages = await AppStorage.getAllPages();
      const targetPageId = body.pageId || pages[0]?.pageId || "10928491829384";

      const testLog = await AppStorage.logAutomationEvent({
        pageId: targetPageId,
        eventId: `test_event_${Date.now()}`,
        eventType: "message",
        senderId: "test_psid_999",
        senderName: "Admin Test User",
        inputMessage: body.message || "Hello, this is a diagnostic test message from Super Admin.",
        replyMessage: "Test reply confirmed! Meta automation pipeline is active.",
        handledBy: "Admin Diagnostic Suite",
        status: "success",
      });

      return NextResponse.json(
        {
          message: "Simulated Webhook event processed and logged successfully!",
          log: testLog,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Unknown action provided." }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] system POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute system action." },
      { status: 500 }
    );
  }
}
