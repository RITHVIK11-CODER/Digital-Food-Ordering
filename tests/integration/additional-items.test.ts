import { describe, it, expect } from 'vitest';
import { cafeStore } from '@/lib/store/cafe-store';

describe('Additional Items & Active Order Recalculation Integration', () => {
  it('correctly appends additional items to an active order and recalculates totals and audit events', () => {
    const table = cafeStore.getTables()[2];
    const session = cafeStore.getOrCreateTableSession(table.id);
    const item1 = cafeStore.getMenuItems()[0];
    const item2 = cafeStore.getMenuItems()[1];

    const initialOrder = cafeStore.createOrder({
      tableId: table.id,
      sessionId: session.id,
      customerName: 'Aarav',
      items: [{ menuItemId: item1.id, quantity: 1 }],
    });

    const initialTotal = initialOrder.total;
    expect(initialOrder.items?.length).toBe(1);

    // Add additional item
    const updatedOrder = cafeStore.addAdditionalItem({
      orderId: initialOrder.id,
      menuItemId: item2.id,
      quantity: 2,
      specialNotes: 'Extra hot',
      staffId: 'b0000000-0000-0000-0000-000000000003',
    });

    expect(updatedOrder.items?.length).toBe(2);
    expect(updatedOrder.items?.[1].is_additional).toBe(true);
    expect(updatedOrder.total).toBeGreaterThan(initialTotal);

    // Verify audit events contain the addition
    const lastEvent = updatedOrder.events?.[updatedOrder.events.length - 1];
    expect(lastEvent?.notes).toContain('Added');
  });
});
