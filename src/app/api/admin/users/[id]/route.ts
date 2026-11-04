import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { role } = body;

    if (role !== "admin" && role !== "merchant") {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'merchant'." },
        { status: 400 }
      );
    }

    // Prevent demoting the primary built-in admin
    if (id === "user_admin" || id === session.userId) {
      if (role !== "admin") {
        return NextResponse.json(
          { error: "Cannot demote your own active admin account." },
          { status: 400 }
        );
      }
    }

    const success = await AppStorage.updateUserRoleAdmin(id, role);
    if (!success) {
      return NextResponse.json({ error: "User not found or role update failed." }, { status: 404 });
    }

    return NextResponse.json({ message: `User role successfully updated to ${role}!` }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] users PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (id === "user_admin" || id === session.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own active admin account." },
        { status: 400 }
      );
    }

    const success = await AppStorage.deleteUserAdmin(id);
    if (!success) {
      return NextResponse.json({ error: "User not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin API] users DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
