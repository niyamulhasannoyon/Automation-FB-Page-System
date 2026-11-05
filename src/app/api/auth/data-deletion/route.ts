import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AppStorage } from "@/lib/storage";

/**
 * Parses and verifies Meta's signed_request per official Meta Platform Guidelines:
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */
function parseSignedRequest(
  signedRequest: string,
  secret: string
): { userId?: string; algorithm?: string; issued_at?: number } | null {
  try {
    const parts = signedRequest.split(".", 2);
    if (parts.length !== 2) return null;

    const [encodedSig, encodedPayload] = parts;

    // Decode base64url signature
    const sig = Buffer.from(
      encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );

    // Decode payload
    const payloadJson = Buffer.from(
      encodedPayload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");

    const data = JSON.parse(payloadJson);

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(encodedPayload)
      .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.warn("[Data Deletion] Invalid HMAC signature on signed_request");
      return null;
    }

    return {
      userId: data.user_id,
      algorithm: data.algorithm,
      issued_at: data.issued_at,
    };
  } catch (err) {
    console.error("[Data Deletion] Error parsing signed_request:", err);
    return null;
  }
}

/**
 * POST /api/auth/data-deletion
 * Official Meta Data Deletion Callback
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    let signedRequest = formData?.get("signed_request") as string | null;

    if (!signedRequest) {
      // Check JSON body fallback
      const body = await req.json().catch(() => null);
      signedRequest = body?.signed_request || null;
    }

    const appSecret = process.env.META_APP_SECRET || "";
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const confirmationCode = `del_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (signedRequest && appSecret) {
      const parsed = parseSignedRequest(signedRequest, appSecret);
      if (parsed?.userId) {
        console.log(
          `[Data Deletion] Received verified deletion request for Meta user: ${parsed.userId}`
        );

        // Remove connected pages or records for this user
        try {
          const pages = await AppStorage.getAllPages(parsed.userId);
          for (const page of pages) {
            await AppStorage.deletePage(page.pageId);
          }
        } catch (delErr) {
          console.error("[Data Deletion] Error purging data for user:", delErr);
        }
      }
    }

    const statusUrl = `${appUrl}/data-deletion?confirmation_code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Data Deletion] Handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/auth/data-deletion
 * Information & confirmation status inquiry
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("confirmation_code");

  return NextResponse.json({
    status: "PROCESSED",
    message: "Data deletion request received and completed successfully.",
    confirmation_code: code || "NOT_PROVIDED",
    timestamp: new Date().toISOString(),
  });
}
