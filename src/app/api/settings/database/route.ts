import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import {
  getMongoUri,
  setMongoUri,
  testMongoConnection,
  maskMongoUri,
} from "@/lib/db";
import { hasGeminiApiKey } from "@/lib/ai-salesman";

export async function GET() {
  try {
    const connInfo = await AppStorage.getConnectionInfo();
    const hasGemini = hasGeminiApiKey();

    return NextResponse.json(
      {
        database: {
          isConnected: connInfo.isConnected,
          mode: connInfo.mode,
          location: connInfo.location,
          currentUri: connInfo.currentUri,
          rawUriHint: getMongoUri().startsWith("mongodb+srv://")
            ? "MongoDB Atlas (Cloud)"
            : "MongoDB Local / Standalone",
        },
        aiSalesman: {
          hasGeminiKey: hasGemini,
          activeEngine: hasGemini
            ? "Google Gemini 1.5 Flash (API Key Configured)"
            : "Smart Bengali/Banglish Contextual Simulator (Offline Ready)",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Settings Database GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve database status." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, uri } = body;

    // Action 1: Test Connection
    if (action === "test") {
      const uriToTest = (uri && uri.trim()) || getMongoUri();
      const testResult = await testMongoConnection(uriToTest);
      return NextResponse.json(
        {
          success: testResult.success,
          latencyMs: testResult.latencyMs,
          error: testResult.error,
          testedUri: maskMongoUri(uriToTest),
        },
        { status: 200 }
      );
    }

    // Action 2: Apply URI and Connect
    if (action === "apply") {
      if (!uri || !uri.trim()) {
        return NextResponse.json(
          { error: "A valid MongoDB URI is required to apply changes." },
          { status: 400 }
        );
      }

      const cleanUri = uri.trim();
      const testResult = await testMongoConnection(cleanUri);

      if (!testResult.success) {
        return NextResponse.json(
          {
            success: false,
            latencyMs: testResult.latencyMs,
            error: testResult.error || "Could not connect to specified MongoDB URI.",
          },
          { status: 400 }
        );
      }

      // Apply new URI
      setMongoUri(cleanUri);
      await AppStorage.recheckMongoConnection();
      const connInfo = await AppStorage.getConnectionInfo();

      return NextResponse.json(
        {
          success: true,
          latencyMs: testResult.latencyMs,
          message: "MongoDB URI updated and connected successfully!",
          database: connInfo,
        },
        { status: 200 }
      );
    }

    // Action 3: Reconnect to current URI
    if (action === "reconnect") {
      const isReconnected = await AppStorage.recheckMongoConnection();
      const connInfo = await AppStorage.getConnectionInfo();

      return NextResponse.json(
        {
          success: isReconnected,
          message: isReconnected
            ? "Successfully reconnected to MongoDB instance."
            : "MongoDB instance unreachable. Operating in local persistent store (.data/db.json).",
          database: connInfo,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action. Expected 'test', 'apply', or 'reconnect'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API Settings Database POST] Error:", error);
    return NextResponse.json(
      { error: "Database manager operation failed." },
      { status: 500 }
    );
  }
}
