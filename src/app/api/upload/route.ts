import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Uploads media buffer directly to Cloudinary using standard REST API
 */
async function uploadToCloudinary(
  buffer: Buffer,
  cloudinaryUrl: string
): Promise<string | null> {
  try {
    const url = new URL(cloudinaryUrl);
    const apiKey = url.username;
    const apiSecret = url.password;
    const cloudName = url.hostname;
    if (!apiKey || !apiSecret || !cloudName) return null;

    const timestamp = Math.round(Date.now() / 1000);
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureStr)
      .digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url || data.url || null;
  } catch (err) {
    console.warn("[Upload] Cloudinary upload error, using fallback:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No media file provided." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "";
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload JPG, PNG, WEBP, or GIF." },
        { status: 400 }
      );
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit (10MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Priority: Cloudinary Upload if CLOUDINARY_URL is provided in environment
    if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim().length > 0) {
      const cloudinaryUrl = await uploadToCloudinary(
        buffer,
        process.env.CLOUDINARY_URL.trim()
      );
      if (cloudinaryUrl) {
        return NextResponse.json(
          {
            url: cloudinaryUrl,
            fileName: file.name,
            size: file.size,
            mimeType,
            provider: "cloudinary",
          },
          { status: 201 }
        );
      }
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // 2. Local uploads directory (in local development or persistent storage)
    try {
      if (!process.env.VERCEL) {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/${filename}`;
        return NextResponse.json(
          {
            url: publicUrl,
            fileName: file.name,
            size: file.size,
            mimeType,
            provider: "local",
          },
          { status: 201 }
        );
      }
    } catch {
      // If filesystem is read-only (serverless), fallback smoothly to Base64
    }

    // 3. Fallback: Base64 data URL
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return NextResponse.json(
      {
        url: dataUrl,
        fileName: file.name,
        size: file.size,
        mimeType,
        provider: "base64",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to process media upload." },
      { status: 500 }
    );
  }
}
