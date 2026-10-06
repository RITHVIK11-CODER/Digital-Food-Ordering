import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";

export async function GET() {
  try {
    const settings = cafeStore.getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = cafeStore.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
