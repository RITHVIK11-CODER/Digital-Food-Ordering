import { NextResponse } from "next/server";
import { getSettingsFromDb, updateSettingsInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const dbSettings = await getSettingsFromDb();
    const settings = dbSettings || cafeStore.getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = extractAuthContext(request);
    if (!verifyPermission(auth.role, "TOGGLE_ORDERING_PAUSE")) {
      return NextResponse.json(
        { error: "Forbidden: Only Owner or Operations Manager can modify cafe settings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dbUpdated = await updateSettingsInDb(body);
    const updated = dbUpdated || cafeStore.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
