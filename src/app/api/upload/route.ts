import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    const ext = path.extname(file.name) || ".jpg";
    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    try {
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
        },
        { status: 201 }
      );
    } catch {
      // In serverless environments where local filesystem might be restricted, fallback to Data URL
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json(
        {
          url: dataUrl,
          fileName: file.name,
          size: file.size,
          mimeType,
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to process media upload." },
      { status: 500 }
    );
  }
}
