import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { CreateManualBillSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const bills = cafeStore.getBills();
    return NextResponse.json(bills);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();

    // Check if it's a request bill from customer or manual bill from cashier
    if (json.isManual) {
      const validated = CreateManualBillSchema.parse(json);
      const session = cafeStore.getOrCreateTableSession(validated.tableId, validated.customerName);
      
      const order = cafeStore.createOrder({
        tableId: validated.tableId,
        sessionId: session.id,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        items: validated.items,
        isManual: true,
        createdByStaffId: validated.staffId,
      });

      const bill = cafeStore.requestBill({
        tableId: validated.tableId,
        sessionId: session.id,
      });

      return NextResponse.json({ order, bill }, { status: 201 });
    } else {
      const { tableId, sessionId, splitType, splitCount } = json;
      if (!tableId || !sessionId) {
        return NextResponse.json({ error: "tableId and sessionId are required" }, { status: 400 });
      }
      const bill = cafeStore.requestBill({ tableId, sessionId, splitType, splitCount });
      return NextResponse.json(bill, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

