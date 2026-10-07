import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";

  try {
    const supabase = getAdminSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("cafe_settings").select("id").limit(1);
      if (error) dbStatus = "degraded";
    } else {
      dbStatus = "fallback_store";
    }
  } catch {
    dbStatus = "unreachable";
  }

  const latency = Date.now() - startTime;

  return NextResponse.json({
    status: "ok",
    app: "Velvet Bloom Café",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    serverLatencyMs: latency,
  });
}
