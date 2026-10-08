import { NextResponse } from "next/server";
import { addAdditionalItemInDb } from "@/lib/supabase/db";
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

    let order = null;
    try {
      order = await addAdditionalItemInDb({
        orderId: id,
        menuItemId: validated.menuItemId,
        quantity: validated.quantity,
        specialNotes: validated.specialNotes,
        selectedOptions: validated.selectedOptions,
        staffId: validated.staffId,
      });
    } catch (dbErr) {
      console.warn("addAdditionalItemInDb fallback to store:", dbErr);
    }

    if (!order) {
      order = cafeStore.addAdditionalItem({
        orderId: id,
        menuItemId: validated.menuItemId,
        quantity: validated.quantity,
        specialNotes: validated.specialNotes,
        selectedOptions: validated.selectedOptions,
        staffId: validated.staffId,
      });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add item to order" }, { status: 400 });
  }
}


