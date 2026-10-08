import { NextResponse } from "next/server";
import { getStaffSessionFromCookieString } from "@/lib/auth/staff-auth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const session = getStaffSessionFromCookieString(cookieHeader);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      role: session.role,
      name: session.staffName,
    },
  });
}

