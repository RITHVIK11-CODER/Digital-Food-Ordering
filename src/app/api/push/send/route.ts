import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSubscriptions } from "@/lib/push/subscriptions";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@velvetbloomcafe.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("VAPID config error:", err);
  }
}

export async function POST(request: Request) {
  try {
    const { title, message, recipientRole, tableSessionId, url } = await request.json();

    const key = recipientRole || tableSessionId || "anonymous";
    const sub = getSubscriptions().get(key);

    if (!sub) {
      return NextResponse.json({
        success: false,
        message: "No active browser subscription found for target recipient. Browser HTTPS permission required.",
      });
    }

    const payload = JSON.stringify({
      title: title || "Velvet Bloom Café",
      body: message,
      icon: "/icons/icon-192.png",
      data: { url: url || "/" },
    });

    await webpush.sendNotification(sub, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

