import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/staff-auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/staff", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
