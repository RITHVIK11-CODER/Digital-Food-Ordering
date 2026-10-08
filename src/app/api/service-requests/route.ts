import { NextResponse } from "next/server";
import { getServiceRequestsFromDb, createServiceRequestInDb, updateServiceRequestStatusInDb } from "@/lib/supabase/db";
import { cafeStore } from "@/lib/store/cafe-store";
import { ServiceRequestSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const dbRequests = await getServiceRequestsFromDb();
    const requests = dbRequests.length > 0 ? dbRequests : cafeStore.getServiceRequests();
    return NextResponse.json(requests, {
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
    const validated = ServiceRequestSchema.parse(json);

    let req;
    try {
      req = await createServiceRequestInDb(
        validated.tableId,
        validated.sessionId,
        validated.requestType,
        validated.notes
      );
    } catch {
      req = cafeStore.createServiceRequest(
        validated.tableId,
        validated.sessionId,
        validated.requestType,
        validated.notes
      );
    }

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

    let updated;
    try {
      updated = await updateServiceRequestStatusInDb(id, status);
    } catch {
      updated = cafeStore.updateServiceRequestStatus(id, status);
    }

    return NextResponse.json(updated, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

