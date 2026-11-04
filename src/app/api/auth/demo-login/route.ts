import { NextRequest, NextResponse } from "next/server";
import { signJwt, DEMO_USER } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = await signJwt(DEMO_USER);
    const res = NextResponse.json(
      {
        message: "Logged in via One-Click Demo Mode!",
        user: DEMO_USER,
      },
      { status: 200 }
    );

    res.cookies.set("autopage_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Failed to initialize demo session." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = await signJwt(DEMO_USER);
  const redirectUrl = new URL("/", req.url);
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.set("autopage_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return res;
}
