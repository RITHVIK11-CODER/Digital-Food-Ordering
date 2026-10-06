import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { AddItemToOrderSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const validated = AddItemToOrderSchema.parse({ ...json, orderId: id });

    const order = cafeStore.addAdditionalItem({
      orderId: id,
      menuItemId: validated.menuItemId,
      quantity: validated.quantity,
      specialNotes: validated.specialNotes,
      selectedOptions: validated.selectedOptions,
      staffId: validated.staffId,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add item to order" }, { status: 400 });
  }
}
