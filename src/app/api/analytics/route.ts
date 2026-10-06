import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";

export async function GET() {
  try {
    const analytics = cafeStore.getAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
