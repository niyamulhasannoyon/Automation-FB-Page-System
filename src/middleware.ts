import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static resources and Next internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public endpoints
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/status")
  ) {
    return NextResponse.next();
  }

  // 3. Check auth_token cookie
  const token = req.cookies.get("auth_token")?.value;
  const user = token ? await verifyJwt(token) : null;

  if (!user) {
    // If requesting an API route, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    // Redirect dashboard pages to /login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, pass through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
