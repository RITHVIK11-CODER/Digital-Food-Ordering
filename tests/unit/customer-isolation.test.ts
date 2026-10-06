import { describe, it, expect } from "vitest";
import { cafeStore } from "@/lib/store/cafe-store";

describe("Customer Session Isolation & Security Barrier", () => {
  it("strictly scopes orders and bills to their respective table sessions", () => {
    const table1 = cafeStore.getTables()[0];
    const table2 = cafeStore.getTables()[1];

    const session1 = cafeStore.getOrCreateTableSession(table1.id, "Table 1 Guest");
    const session2 = cafeStore.getOrCreateTableSession(table2.id, "Table 2 Guest");

    const item = cafeStore.getMenuItems()[0];

    // Place Order for Table 1
    const order1 = cafeStore.createOrder({
      tableId: table1.id,
      sessionId: session1.id,
      customerName: "Table 1 Guest",
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    // Place Order for Table 2
    const order2 = cafeStore.createOrder({
      tableId: table2.id,
      sessionId: session2.id,
      customerName: "Table 2 Guest",
      items: [{ menuItemId: item.id, quantity: 2 }],
    });

    // Table 1 queries only their session
    const table1Orders = cafeStore.getOrders({ tableId: table1.id, sessionId: session1.id });
    expect(table1Orders.some((o) => o.id === order1.id)).toBe(true);
    expect(table1Orders.some((o) => o.id === order2.id)).toBe(false);

    // Table 2 queries only their session
    const table2Orders = cafeStore.getOrders({ tableId: table2.id, sessionId: session2.id });
    expect(table2Orders.some((o) => o.id === order2.id)).toBe(true);
    expect(table2Orders.some((o) => o.id === order1.id)).toBe(false);
  });
});

