import { NextResponse } from "next/server";
import { getTableByIdOrTokenFromDb, getOrCreateTableSessionInDb, updateTableInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbTable = await getTableByIdOrTokenFromDb(id);
    const table = dbTable || cafeStore.getTableByIdOrToken(id);

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const dbSession = await getOrCreateTableSessionInDb(table.id);
    const session = dbSession || cafeStore.getOrCreateTableSession(table.id);

    return NextResponse.json({ table, session });
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
    const body = await request.json();
    const dbUpdated = await updateTableInDb(id, body);
    const updated = dbUpdated || cafeStore.updateTable(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
