import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const categories = cafeStore.getCategories();
    const items = cafeStore.getMenuItems(categoryId);
    return NextResponse.json({ categories, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newItem = cafeStore.createMenuItem(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
