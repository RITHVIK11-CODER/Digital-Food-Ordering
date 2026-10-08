import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "vb_staff_session";

// Route protection matrix
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["OWNER", "MANAGER"],
  "/owner": ["OWNER", "MANAGER"],
  "/chef": ["CHEF", "OWNER", "MANAGER"],
  "/waiter": ["WAITER", "OWNER", "MANAGER"],
  "/cashier": ["CASHIER", "OWNER", "MANAGER"],
};

function parseSessionCookie(token?: string): { role: string; exp: number } | null {
  if (!token || !token.includes(".")) return null;
  try {
    const [payloadB64] = token.split(".");
    const decodedStr = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decodedStr);
    if (!payload.role || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current route matches protected staff route
  const matchingRoute = Object.keys(PROTECTED_ROUTES).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchingRoute) {
    return NextResponse.next();
  }

  const allowedRoles = PROTECTED_ROUTES[matchingRoute];
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(cookie);

  // 1. Unauthenticated -> Redirect to /staff
  if (!session) {
    const loginUrl = new URL("/staff", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Unauthorized Role -> Redirect to /staff with error
  if (!allowedRoles.includes(session.role)) {
    const loginUrl = new URL("/staff", request.url);
    loginUrl.searchParams.set("error", "unauthorized");
    loginUrl.searchParams.set("required", allowedRoles.join(" or "));
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/chef/:path*", "/waiter/:path*", "/cashier/:path*"],
};

