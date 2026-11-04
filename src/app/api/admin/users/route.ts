import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const users = await AppStorage.getAllUsersAdmin();
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] users GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}

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
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await AppStorage.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(String(password));
    const newUser = await AppStorage.createUser({
      name: String(name).trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "merchant",
    });

    return NextResponse.json(
      {
        message: "User created successfully!",
        user: {
          id: newUser.id || newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] users POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user." },
      { status: 500 }
    );
  }
}
