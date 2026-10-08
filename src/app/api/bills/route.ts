import { NextResponse } from "next/server";
import { getBillsFromDb, requestBillInDb, getOrCreateTableSessionInDb, createOrderInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { CreateManualBillSchema } from "@/lib/validation/schemas";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const dbBills = await getBillsFromDb();
    const bills = dbBills.length > 0 ? dbBills : cafeStore.getBills();
    return NextResponse.json(bills, {
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

    if (json.isManual) {
      const auth = extractAuthContext(request);
      if (!verifyPermission(auth.role, "CREATE_MANUAL_BILL")) {
        return NextResponse.json({ error: "Forbidden: Not permitted to create manual bills." }, { status: 403 });
      }

      const validated = CreateManualBillSchema.parse(json);
      const session = (await getOrCreateTableSessionInDb(validated.tableId, validated.customerName)) || cafeStore.getOrCreateTableSession(validated.tableId, validated.customerName);

      const order = await createOrderInDb({
        tableId: validated.tableId,
        sessionId: session.id,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        items: validated.items,
        isManual: true,
        createdByStaffId: validated.staffId,
      });

      const bill = await requestBillInDb({
        tableId: validated.tableId,
        sessionId: session.id,
      });

      return NextResponse.json({ order, bill }, { status: 201 });
    } else {
      const { tableId, sessionId, splitType, splitCount } = json;
      if (!tableId || !sessionId) {
        return NextResponse.json({ error: "tableId and sessionId are required" }, { status: 400 });
      }

      let bill;
      try {
        bill = await requestBillInDb({ tableId, sessionId, splitType, splitCount });
      } catch {
        bill = cafeStore.requestBill({ tableId, sessionId, splitType, splitCount });
      }
      return NextResponse.json(bill, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
