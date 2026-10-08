import { NextResponse } from "next/server";
import { getOrdersFromDb, createOrderInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { CreateOrderSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const dbOrders = await getOrdersFromDb({ tableId, sessionId, status });
    const orders = dbOrders.length > 0 ? dbOrders : cafeStore.getOrders({ tableId, sessionId, status });
    return NextResponse.json(orders, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validated = CreateOrderSchema.parse(json);

    let order;
    try {
      order = await createOrderInDb({
        tableId: validated.tableId,
        sessionId: validated.sessionId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        items: validated.items,
        specialInstructions: validated.specialInstructions,
      });
    } catch (dbErr: any) {
      console.warn("Falling back to transactional store for order creation:", dbErr.message);
      order = cafeStore.createOrder({
        tableId: validated.tableId,
        sessionId: validated.sessionId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        items: validated.items,
        specialInstructions: validated.specialInstructions,
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid order payload" }, { status: 400 });
  }
}
