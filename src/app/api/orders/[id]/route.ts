import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { UpdateOrderStatusSchema } from "@/lib/validation/schemas";
import { extractAuthContext, verifyPermission } from "@/lib/auth/rbac";
import { UserRole } from "@/types/database.types";

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
    const auth = extractAuthContext(request);

    // Map status transition to permission key
    const roleCandidate: UserRole = auth.role !== "CUSTOMER" ? auth.role : (validated.actorType === "SYSTEM" ? "OWNER" : validated.actorType as UserRole);

    if (validated.status === "ACCEPTED" && !verifyPermission(roleCandidate, "ACCEPT_ORDER")) {
      return NextResponse.json({ error: "Forbidden: Only Chef/Owner can accept orders." }, { status: 403 });
    }
    if (validated.status === "PREPARING" && !verifyPermission(roleCandidate, "PREPARE_ORDER")) {
      return NextResponse.json({ error: "Forbidden: Only Chef/Owner can start preparing orders." }, { status: 403 });
    }
    if (validated.status === "READY" && !verifyPermission(roleCandidate, "READY_ORDER")) {
      return NextResponse.json({ error: "Forbidden: Only Chef/Owner can mark orders ready." }, { status: 403 });
    }
    if (validated.status === "SERVED" && !verifyPermission(roleCandidate, "SERVE_ORDER")) {
      return NextResponse.json({ error: "Forbidden: Only Waiter/Owner can mark orders served." }, { status: 403 });
    }

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
