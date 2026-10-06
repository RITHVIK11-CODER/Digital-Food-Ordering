import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const paymentMethod = body.paymentMethod || "UPI";

    const bill = cafeStore.markBillPaid(id, paymentMethod);
    return NextResponse.json(bill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
