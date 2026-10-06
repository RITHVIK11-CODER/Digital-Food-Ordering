import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { UpdateOrderStatusSchema } from "@/lib/validation/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = cafeStore.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const validated = UpdateOrderStatusSchema.parse({ ...json, orderId: id });

    const order = cafeStore.updateOrderStatus({
      orderId: validated.orderId,
      newStatus: validated.status,
      actorType: validated.actorType,
      actorId: validated.actorId,
      notes: validated.notes,
      estimatedMinutes: validated.estimatedMinutes,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 400 });
  }
}
