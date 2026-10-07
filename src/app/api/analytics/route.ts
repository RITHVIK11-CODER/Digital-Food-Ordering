import { NextResponse } from "next/server";
import { getAnalyticsFromDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";

export async function GET(request: Request) {
  try {
    const auth = extractAuthContext(request);
    // Enforce server-side authorization: only OWNER or MANAGER
    if (!verifyPermission(auth.role, "VIEW_15DAY_ANALYTICS")) {
      return NextResponse.json(
        { error: "Forbidden: Only Owner or Operations Manager can view financial analytics." },
        { status: 403 }
      );
    }

    const dbAnalytics = await getAnalyticsFromDb();
    const analytics = dbAnalytics || cafeStore.getAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

