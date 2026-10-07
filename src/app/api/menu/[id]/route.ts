import { NextResponse } from "next/server";
import { getMenuItemByIdFromDb, updateMenuItemInDb, deleteMenuItemInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbItem = await getMenuItemByIdFromDb(id);
    const item = dbItem || cafeStore.getMenuItemById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
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
    const auth = extractAuthContext(request);
    const body = await request.json();

    // Availability toggle allowed for CHEF, MANAGER, OWNER
    if (body.is_available !== undefined && !verifyPermission(auth.role, "TOGGLE_ITEM_AVAILABILITY")) {
      return NextResponse.json({ error: "Forbidden: Not permitted to toggle availability." }, { status: 403 });
    }

    const dbUpdated = await updateMenuItemInDb(id, body);
    const updated = dbUpdated || cafeStore.updateMenuItem(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = extractAuthContext(request);

    if (!verifyPermission(auth.role, "MANAGE_MENU")) {
      return NextResponse.json(
        { error: "Forbidden: Only Owner or Operations Manager can delete menu items." },
        { status: 403 }
      );
    }

    const dbDeleted = await deleteMenuItemInDb(id);
    return NextResponse.json({ success: true, deleted: dbDeleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}



