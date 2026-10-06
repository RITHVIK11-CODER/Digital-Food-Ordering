import { NextResponse } from "next/server";
import { getTablesFromDb, createTableInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";

export async function GET() {
  try {
    const dbTables = await getTablesFromDb();
    const tables = dbTables.length > 0 ? dbTables : cafeStore.getTables();
    return NextResponse.json(tables);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableNumber, capacity } = body;
    if (!tableNumber) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 });
    }
    const dbTable = await createTableInDb(tableNumber, capacity || 4);
    const table = dbTable || cafeStore.createTable(tableNumber, capacity || 4);
    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
