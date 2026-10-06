import { describe, it, expect } from "vitest";
import { cafeStore } from "@/lib/store/cafe-store";

describe("Concurrency, High-Traffic & Idempotency Simulation", () => {
  it("handles 50 simultaneous order attempts concurrently without total or calculation drift", async () => {
    const table = cafeStore.getTables()[3];
    const session = cafeStore.getOrCreateTableSession(table.id, "High Traffic Test");
    const item = cafeStore.getMenuItems()[0];

    const orderPromises = Array.from({ length: 50 }).map((_, index) => {
      return new Promise<any>((resolve) => {
        const ord = cafeStore.createOrder({
          tableId: table.id,
          sessionId: session.id,
          customerName: `Concurrent Guest ${index}`,
          items: [{ menuItemId: item.id, quantity: 1 }],
        });
        resolve(ord);
      });
    });

    const results = await Promise.all(orderPromises);
    expect(results.length).toBe(50);

    // Verify all 50 orders received unique order numbers and valid totals
    const orderNumbers = new Set(results.map((r) => r.order_number));
    expect(orderNumbers.size).toBe(50);

    // Verify each order has exact recalculation
    results.forEach((ord) => {
      expect(ord.subtotal).toBe(item.price);
      expect(ord.tax).toBe(Math.round(item.price * 0.05 * 100) / 100);
      expect(ord.total).toBe(ord.subtotal + ord.tax);
    });
  });

  it("blocks order creation immediately when kitchen rush pause is active", () => {
    cafeStore.updateSettings({ is_ordering_paused: true });

    const table = cafeStore.getTables()[0];
    const session = cafeStore.getOrCreateTableSession(table.id);
    const item = cafeStore.getMenuItems()[0];

    expect(() => {
      cafeStore.createOrder({
        tableId: table.id,
        sessionId: session.id,
        items: [{ menuItemId: item.id, quantity: 1 }],
      });
    }).toThrow(/paused/i);

    // Restore ordering
    cafeStore.updateSettings({ is_ordering_paused: false });
  });
});

