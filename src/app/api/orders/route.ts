import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { CreateOrderSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const orders = cafeStore.getOrders({ tableId, sessionId, status });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validated = CreateOrderSchema.parse(json);

    const order = cafeStore.createOrder({
      tableId: validated.tableId,
      sessionId: validated.sessionId,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      items: validated.items,
      specialInstructions: validated.specialInstructions,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid order payload" }, { status: 400 });
  }
}
