import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { hashPassword, signJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await AppStorage.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(String(password));
    const newUser = await AppStorage.createUser({
      email: cleanEmail,
      name: String(name).trim(),
      password: hashedPassword,
      role: "merchant",
    });

    const sessionPayload = {
      userId: newUser._id || newUser.id || `user_${Date.now()}`,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = await signJwt(sessionPayload);

    const res = NextResponse.json(
      {
        message: "Account registered successfully!",
        user: sessionPayload,
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return res;
  } catch (error: unknown) {
    console.error("Register error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
