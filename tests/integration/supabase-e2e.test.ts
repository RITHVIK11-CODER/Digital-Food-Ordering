import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import {
  calculateOrderPricing,
  calculateEqualSplit,
} from "@/lib/pricing";
import { verifyPermission } from "@/lib/auth/rbac";

// Load .env.local if present
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  } else {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (e) {
  // Ignored if missing
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

describe("Supabase Production End-to-End Test Suite", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, serviceRoleKey);
  });

  it("1. Verifies live connection to Supabase PostgreSQL", async () => {
    const { data, error } = await supabase.from("cafe_settings").select("*").limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0].cafe_name).toBe("Velvet Bloom Café");
  });

  it("2. Verifies seed data across tables, categories, menu items, and staff users", async () => {
    const [tablesRes, catsRes, itemsRes, usersRes] = await Promise.all([
      supabase.from("tables").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("menu_items").select("*"),
      supabase.from("users").select("*"),
    ]);

    expect(tablesRes.data?.length).toBeGreaterThanOrEqual(12);
    expect(catsRes.data?.length).toBeGreaterThanOrEqual(6);
    expect(itemsRes.data?.length).toBeGreaterThanOrEqual(10);
    expect(usersRes.data?.length).toBeGreaterThanOrEqual(5);

    // Verify staff roles exist
    const roles = usersRes.data?.map((u: any) => u.role);
    expect(roles).toContain("OWNER");
    expect(roles).toContain("CHEF");
    expect(roles).toContain("WAITER");
    expect(roles).toContain("CASHIER");
    expect(roles).toContain("MANAGER");
  });

  it("3. Verifies Customer Order Flow: creation, authoritative price recalculation, and status updates", async () => {
    // 1. Get Table 1 and an item
    const { data: table } = await supabase.from("tables").select("*").eq("table_number", "Table 1").single();
    const { data: item } = await supabase.from("menu_items").select("*").eq("name", "Rose Gold Velvet Latte").single();

    expect(table).toBeDefined();
    expect(item).toBeDefined();

    // 2. Create Table Session
    const sessionToken = `e2e_sess_${Date.now()}`;
    const { data: session, error: sessErr } = await supabase
      .from("table_sessions")
      .insert({
        table_id: table.id,
        session_token: sessionToken,
        customer_name: "E2E Test Patron",
        is_active: true,
      })
      .select()
      .single();

    expect(sessErr).toBeNull();
    expect(session).toBeDefined();

    // 3. Recalculate price server-side
    const pricing = calculateOrderPricing(
      [{ unitPrice: Number(item.price), quantity: 2, optionsExtraPrice: 40 }], // 2x Latte with Oat Milk
      5, // 5% GST
      0,
      0
    );

    // Subtotal: (320 + 40) * 2 = 720.00
    // Tax: 720 * 0.05 = 36.00
    // Total: 756.00
    expect(pricing.subtotal).toBe(720);
    expect(pricing.tax).toBe(36);
    expect(pricing.finalTotal).toBe(756);

    // 4. Create Order in Database
    const orderNumber = `E2E-${Date.now().toString().slice(-4)}`;
    const { data: order, error: ordErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        table_id: table.id,
        session_id: session.id,
        customer_name: "E2E Test Patron",
        status: "PENDING",
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.finalTotal,
      })
      .select()
      .single();

    expect(ordErr).toBeNull();
    expect(order.status).toBe("PENDING");
    expect(Number(order.total)).toBe(756);

    // 5. Chef updates status to ACCEPTED -> PREPARING -> READY
    const { data: acceptedOrder } = await supabase
      .from("orders")
      .update({ status: "ACCEPTED" })
      .eq("id", order.id)
      .select()
      .single();
    expect(acceptedOrder.status).toBe("ACCEPTED");

    const { data: readyOrder } = await supabase
      .from("orders")
      .update({ status: "READY" })
      .eq("id", order.id)
      .select()
      .single();
    expect(readyOrder.status).toBe("READY");

    // 6. Waiter serves order
    const { data: servedOrder } = await supabase
      .from("orders")
      .update({ status: "SERVED" })
      .eq("id", order.id)
      .select()
      .single();
    expect(servedOrder.status).toBe("SERVED");

    // 7. Request Bill and Equal Split for 2 people (756 / 2 = 378 each)
    const splits = calculateEqualSplit(Number(servedOrder.total), 2);
    expect(splits).toEqual([378, 378]);

    const { data: bill, error: billErr } = await supabase
      .from("bills")
      .insert({
        bill_number: `BILL-E2E-${Date.now().toString().slice(-4)}`,
        order_id: order.id,
        table_id: table.id,
        session_id: session.id,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        final_total: pricing.finalTotal,
        split_type: "EQUAL",
        split_count: 2,
        status: "REQUESTED",
      })
      .select()
      .single();

    expect(billErr).toBeNull();
    expect(Number(bill.final_total)).toBe(756);

    // 8. Cashier marks bill as PAID via UPI
    const { data: paidBill } = await supabase
      .from("bills")
      .update({ status: "PAID" })
      .eq("id", bill.id)
      .select()
      .single();
    expect(paidBill.status).toBe("PAID");

    // 9. Post Customer Review
    const { data: review, error: revErr } = await supabase
      .from("reviews")
      .insert({
        menu_item_id: item.id,
        order_id: order.id,
        session_id: session.id,
        customer_name: "E2E Test Patron",
        rating: 5,
        cafe_ambience_rating: 5,
        service_rating: 5,
        comment: "Flawless Rose Gold Latte and seamless digital checkout!",
        is_approved: true,
      })
      .select()
      .single();

    expect(revErr).toBeNull();
    expect(review.rating).toBe(5);
  });

  it("4. Verifies Web Push VAPID keys configuration", () => {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    expect(vapidPublic).toBeDefined();
    expect(vapidPrivate).toBeDefined();
    expect(vapidPublic?.length).toBeGreaterThan(20);
    expect(vapidPrivate?.length).toBeGreaterThan(20);
  });

  it("5. Verifies Role-Based Access Control matrix logic", () => {
    expect(verifyPermission("OWNER", "VIEW_15DAY_ANALYTICS")).toBe(true);
    expect(verifyPermission("CHEF", "VIEW_15DAY_ANALYTICS")).toBe(false);
    expect(verifyPermission("WAITER", "MANAGE_MENU")).toBe(false);
    expect(verifyPermission("CASHIER", "SETTLE_PAYMENT")).toBe(true);
    expect(verifyPermission("CUSTOMER", "ACCEPT_ORDER")).toBe(false);
  });
});
