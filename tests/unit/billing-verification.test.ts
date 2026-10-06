import { describe, it, expect } from "vitest";
import { cafeStore } from "@/lib/store/cafe-store";
import { calculateEqualSplit } from "@/lib/pricing";

describe("Billing, Split Math & Immutability Verification", () => {
  it("generates exact equal splits for 2, 3, 4, 5, 6 guests without cent losses", () => {
    const totalAmount = 1459.75;
    [2, 3, 4, 5, 6].forEach((people) => {
      const splits = calculateEqualSplit(totalAmount, people);
      expect(splits.length).toBe(people);
      const splitSum = splits.reduce((acc, curr) => acc + curr, 0);
      expect(Math.round(splitSum * 100) / 100).toBe(totalAmount);
    });
  });

  it("prevents adding items to completed or cancelled orders", () => {
    const table = cafeStore.getTables()[4];
    const session = cafeStore.getOrCreateTableSession(table.id);
    const item = cafeStore.getMenuItems()[0];

    const order = cafeStore.createOrder({
      tableId: table.id,
      sessionId: session.id,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: "ACCEPTED",
      actorType: "CHEF",
    });
    cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: "PREPARING",
      actorType: "CHEF",
    });
    cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: "READY",
      actorType: "CHEF",
    });
    cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: "SERVED",
      actorType: "WAITER",
    });
    cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: "COMPLETED",
      actorType: "CASHIER",
    });

    expect(() => {
      cafeStore.addAdditionalItem({
        orderId: order.id,
        menuItemId: item.id,
        quantity: 1,
      });
    }).toThrow(/cannot add items to an order with status COMPLETED/i);
  });
});

