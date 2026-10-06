import { NextResponse } from "next/server";
import { saveSubscription } from "@/lib/push/subscriptions";

export async function POST(request: Request) {
  try {
    const { subscription, role, tableSessionId } = await request.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    const key = role || tableSessionId || "anonymous";
    saveSubscription(key, subscription);

    return NextResponse.json({ success: true, registeredKey: key });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

