import { NextResponse } from "next/server";
import { cafeStore } from "@/lib/store/cafe-store";
import { ServiceRequestSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const requests = cafeStore.getServiceRequests();
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validated = ServiceRequestSchema.parse(json);

    const req = cafeStore.createServiceRequest(
      validated.tableId,
      validated.sessionId,
      validated.requestType,
      validated.notes
    );

    return NextResponse.json(req, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    const updated = cafeStore.updateServiceRequestStatus(id, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
