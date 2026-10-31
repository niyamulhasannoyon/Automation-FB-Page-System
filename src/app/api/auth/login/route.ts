import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { verifyPassword, signJwt, DEMO_USER } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check Demo credentials shortcut
    if (cleanEmail === "demo@autopage.io" && password === "demo123456") {
      const token = await signJwt(DEMO_USER);
      const res = NextResponse.json(
        {
          message: "Logged in as Demo Merchant!",
          user: DEMO_USER,
        },
        { status: 200 }
      );
      res.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
      return res;
    }

    const user = await AppStorage.getUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(String(password), user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user._id || user.id || "user_demo",
      email: user.email,
      name: user.name,
      role: user.role || "merchant",
    };

    const token = await signJwt(sessionPayload);

    const res = NextResponse.json(
      {
        message: "Login successful!",
        user: sessionPayload,
      },
      { status: 200 }
    );

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to log in." },
      { status: 500 }
    );
  }
}
