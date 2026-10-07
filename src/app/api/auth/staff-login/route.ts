import { NextResponse } from "next/server";
import { verifyStaffCredentials, createStaffSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/staff-auth";
import { UserRole } from "@/types/database.types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, pin } = body;

    if (!role || !pin) {
      return NextResponse.json({ error: "Workstation role and 4-digit PIN are required." }, { status: 400 });
    }

    const verification = await verifyStaffCredentials(role as UserRole, String(pin));

    if (!verification.success || !verification.user) {
      return NextResponse.json({ error: verification.error || "Authentication failed." }, { status: 401 });
    }

    const token = createStaffSessionToken(verification.user);

    // Determine target dashboard
    let redirectUrl = "/admin";
    if (verification.user.role === "CHEF") redirectUrl = "/chef";
    else if (verification.user.role === "WAITER") redirectUrl = "/waiter";
    else if (verification.user.role === "CASHIER") redirectUrl = "/cashier";
    else if (verification.user.role === "OWNER" || verification.user.role === "MANAGER") redirectUrl = "/admin";

    const response = NextResponse.json({
      success: true,
      user: verification.user,
      token,
      redirectUrl,
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
