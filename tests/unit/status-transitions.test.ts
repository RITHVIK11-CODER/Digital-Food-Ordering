import { describe, it, expect } from 'vitest';
import { cafeStore } from '@/lib/store/cafe-store';

describe('Order State Machine & Concurrency Control', () => {
  it('enforces sequential order status transitions', () => {
    // Create an order
    const table = cafeStore.getTables()[0];
    const session = cafeStore.getOrCreateTableSession(table.id);
    const item = cafeStore.getMenuItems()[0];

    const order = cafeStore.createOrder({
      tableId: table.id,
      sessionId: session.id,
      customerName: 'Test Guest',
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    expect(order.status).toBe('PENDING');

    // Valid: PENDING -> ACCEPTED
    const accepted = cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: 'ACCEPTED',
      actorType: 'CHEF',
      estimatedMinutes: 12,
    });
    expect(accepted.status).toBe('ACCEPTED');

    // Valid: ACCEPTED -> PREPARING
    const preparing = cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: 'PREPARING',
      actorType: 'CHEF',
    });
    expect(preparing.status).toBe('PREPARING');

    // Valid: PREPARING -> READY
    const ready = cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: 'READY',
      actorType: 'CHEF',
    });
    expect(ready.status).toBe('READY');

    // Valid: READY -> SERVED
    const served = cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: 'SERVED',
      actorType: 'WAITER',
    });
    expect(served.status).toBe('SERVED');

    // Valid: SERVED -> COMPLETED
    const completed = cafeStore.updateOrderStatus({
      orderId: order.id,
      newStatus: 'COMPLETED',
      actorType: 'CASHIER',
    });
    expect(completed.status).toBe('COMPLETED');
  });

  it('rejects illegal status transitions (e.g. COMPLETED -> PENDING or PENDING -> SERVED)', () => {
    const table = cafeStore.getTables()[1];
    const session = cafeStore.getOrCreateTableSession(table.id);
    const item = cafeStore.getMenuItems()[0];

    const order = cafeStore.createOrder({
      tableId: table.id,
      sessionId: session.id,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    expect(() => {
      cafeStore.updateOrderStatus({
        orderId: order.id,
        newStatus: 'SERVED', // Illegal skip from PENDING to SERVED
        actorType: 'WAITER',
      });
    }).toThrow();
  });
});
