import { describe, it, expect, beforeEach } from "vitest";
import { cafeStore } from "@/lib/store/cafe-store";
import { calculateOrderPricing } from "@/lib/pricing";

describe("Four-Device Production Workflow & Multi-Table Isolation", () => {
  beforeEach(() => {
    // Reset store state if needed
  });

  it("simulates full end-to-end lifecycle across Device 1 (Customer), Device 2 (Chef), Device 3 (Waiter), and Device 4 (Cashier)", () => {
    const tables = cafeStore.getTables();
    const table1 = tables[0]; // Table 1
    const menuItems = cafeStore.getMenuItems();
    const cappuccino = menuItems.find((m) => m.name.toLowerCase().includes("cappuccino")) || menuItems[0];
    const croissant = menuItems.find((m) => m.name.toLowerCase().includes("croissant")) || menuItems[1];

    // ==========================================
    // DEVICE 1: CUSTOMER (Table 1)
    // ==========================================
    const session1 = cafeStore.getOrCreateTableSession(table1.id, "Rithvik");
    expect(session1).toBeDefined();

    const order1 = cafeStore.createOrder({
      tableId: table1.id,
      sessionId: session1.id,
      customerName: "Rithvik",
      items: [
        {
          menuItemId: cappuccino.id,
          quantity: 2,
          specialNotes: "Oat milk",
        },
      ],
      specialInstructions: "Near window seat",
    });

    expect(order1).toBeDefined();
    expect(order1.status).toBe("PENDING");
    expect(order1.table_id).toBe(table1.id);
    expect(order1.items?.length).toBe(1);

    const initialPricing = calculateOrderPricing(
      [{ unitPrice: Number(cappuccino.price), quantity: 2, optionsExtraPrice: 0 }],
      5.0,
      0
    );
    expect(order1.subtotal).toBe(initialPricing.subtotal);
    expect(order1.tax).toBe(initialPricing.tax);
    expect(order1.total).toBe(initialPricing.finalTotal);

    // ==========================================
    // DEVICE 2: CHEF / KDS (Kitchen Display System)
    // ==========================================
    const chefOrders = cafeStore.getOrders({ status: "PENDING" });
    const chefOrder = chefOrders.find((o) => o.id === order1.id);
    expect(chefOrder).toBeDefined();

    // 1. Chef accepts order (PENDING -> ACCEPTED)
    const acceptedOrder = cafeStore.updateOrderStatus({
      orderId: order1.id,
      newStatus: "ACCEPTED",
      actorType: "CHEF",
      estimatedMinutes: 12,
      notes: "Chef accepted order and estimated 12 mins",
    });
    expect(acceptedOrder.status).toBe("ACCEPTED");
    expect(acceptedOrder.estimated_time_minutes).toBe(12);

    // 2. Chef begins cooking (ACCEPTED -> PREPARING)
    const preparingOrder = cafeStore.updateOrderStatus({
      orderId: order1.id,
      newStatus: "PREPARING",
      actorType: "CHEF",
      notes: "Brewing coffee",
    });
    expect(preparingOrder.status).toBe("PREPARING");

    // 3. Chef finishes (PREPARING -> READY)
    const readyOrder = cafeStore.updateOrderStatus({
      orderId: order1.id,
      newStatus: "READY",
      actorType: "CHEF",
      notes: "Order placed on pickup counter",
    });
    expect(readyOrder.status).toBe("READY");

    // ==========================================
    // DEVICE 3: WAITER (Floor Service)
    // ==========================================
    // Waiter sees ready orders
    const readyOrders = cafeStore.getOrders({ status: "READY" });
    expect(readyOrders.some((o) => o.id === order1.id)).toBe(true);

    // Waiter serves order (READY -> SERVED)
    const servedOrder = cafeStore.updateOrderStatus({
      orderId: order1.id,
      newStatus: "SERVED",
      actorType: "WAITER",
      notes: "Delivered to Table 1",
    });
    expect(servedOrder.status).toBe("SERVED");

    // Customer requests additional item via Waiter
    const preAddTotal = order1.total;
    const orderWithAddon = cafeStore.addAdditionalItem({
      orderId: order1.id,
      menuItemId: croissant.id,
      quantity: 1,
      specialNotes: "Warm butter",
      staffId: "waiter-001",
    });
    expect(orderWithAddon.items?.length).toBe(2);
    expect(orderWithAddon.items?.some((i) => i.is_additional)).toBe(true);
    expect(orderWithAddon.total).toBeGreaterThan(preAddTotal);

    // ==========================================
    // DEVICE 4: CASHIER / ADMIN (Checkout & Billing)
    // ==========================================
    // Cashier generates bill
    const bill = cafeStore.requestBill({
      tableId: table1.id,
      sessionId: session1.id,
    });

    expect(bill).toBeDefined();
    expect(bill.status).toBe("REQUESTED");
    expect(bill.final_total).toBe(orderWithAddon.total);
    expect(bill.tax).toBe(orderWithAddon.tax);

    // Cashier settles payment
    const paidBill = cafeStore.markBillPaid(bill.id, "UPI");
    expect(paidBill.status).toBe("PAID");

    // Bill settlement automatically completes active orders and sets table to CLEANING
    const fetchedOrder = cafeStore.getOrderById(order1.id);
    expect(fetchedOrder?.status).toBe("COMPLETED");

    const fetchedTable = cafeStore.getTables().find((t) => t.id === table1.id);
    expect(fetchedTable?.status).toBe("CLEANING");
  });

  it("verifies multi-table isolation between Table 1 and Table 2", () => {
    const tables = cafeStore.getTables();
    const table1 = tables[0];
    const table2 = tables[1];
    const items = cafeStore.getMenuItems();

    const session1 = cafeStore.getOrCreateTableSession(table1.id, "Table 1 Customer");
    const session2 = cafeStore.getOrCreateTableSession(table2.id, "Table 2 Customer");

    const orderT1 = cafeStore.createOrder({
      tableId: table1.id,
      sessionId: session1.id,
      customerName: "Alice",
      items: [{ menuItemId: items[0].id, quantity: 1 }],
    });

    const orderT2 = cafeStore.createOrder({
      tableId: table2.id,
      sessionId: session2.id,
      customerName: "Bob",
      items: [{ menuItemId: items[1].id, quantity: 2 }],
    });

    // Customer at Table 1 only retrieves Table 1 orders
    const t1CustomerView = cafeStore.getOrders({ tableId: table1.id, sessionId: session1.id });
    expect(t1CustomerView.map((o) => o.id)).toContain(orderT1.id);
    expect(t1CustomerView.map((o) => o.id)).not.toContain(orderT2.id);

    // Customer at Table 2 only retrieves Table 2 orders
    const t2CustomerView = cafeStore.getOrders({ tableId: table2.id, sessionId: session2.id });
    expect(t2CustomerView.map((o) => o.id)).toContain(orderT2.id);
    expect(t2CustomerView.map((o) => o.id)).not.toContain(orderT1.id);
  });

  it("enforces valid status state machine transitions and rejects illegal backwards moves", () => {
    const table = cafeStore.getTables()[2];
    const session = cafeStore.getOrCreateTableSession(table.id, "Charlie");
    const item = cafeStore.getMenuItems()[0];

    const order = cafeStore.createOrder({
      tableId: table.id,
      sessionId: session.id,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    // Valid progression: PENDING -> ACCEPTED -> PREPARING -> READY -> SERVED -> COMPLETED
    const accepted = cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "ACCEPTED", actorType: "CHEF" });
    expect(accepted.status).toBe("ACCEPTED");

    const preparing = cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "PREPARING", actorType: "CHEF" });
    expect(preparing.status).toBe("PREPARING");

    const ready = cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "READY", actorType: "CHEF" });
    expect(ready.status).toBe("READY");

    const served = cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "SERVED", actorType: "WAITER" });
    expect(served.status).toBe("SERVED");

    const completed = cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "COMPLETED", actorType: "CASHIER" });
    expect(completed.status).toBe("COMPLETED");

    // Invalid backwards transition from COMPLETED -> PENDING must throw
    expect(() => {
      cafeStore.updateOrderStatus({ orderId: order.id, newStatus: "PENDING", actorType: "CHEF" });
    }).toThrow(/Invalid status transition/);
  });
});
