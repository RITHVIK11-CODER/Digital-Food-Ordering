import { describe, it, expect } from 'vitest';
import { calculateOrderPricing, calculateEqualSplit } from '@/lib/pricing';

describe('Pricing Calculation Engine', () => {
  it('correctly calculates subtotal, 5% tax and final total for simple items', () => {
    const items = [
      { unitPrice: 320, quantity: 1, optionsExtraPrice: 0 },
      { unitPrice: 440, quantity: 2, optionsExtraPrice: 0 },
    ];

    const result = calculateOrderPricing(items, 5, 0, 0);

    // subtotal = 320 + (440 * 2) = 1200
    expect(result.subtotal).toBe(1200);
    // 5% of 1200 = 60
    expect(result.tax).toBe(60);
    expect(result.finalTotal).toBe(1260);
  });

  it('correctly incorporates customization options extra charges', () => {
    const items = [
      { unitPrice: 440, quantity: 1, optionsExtraPrice: 45 + 75 }, // +120 options
    ];

    const result = calculateOrderPricing(items, 5, 0, 0);

    expect(result.subtotal).toBe(560);
    expect(result.tax).toBe(28);
    expect(result.finalTotal).toBe(588);
  });

  it('correctly applies discounts and avoids negative totals', () => {
    const items = [{ unitPrice: 500, quantity: 1, optionsExtraPrice: 0 }];
    const result = calculateOrderPricing(items, 5, 0, 100);

    expect(result.subtotal).toBe(500);
    expect(result.discount).toBe(100);
    // tax on (500 - 100) = 400 * 0.05 = 20
    expect(result.tax).toBe(20);
    expect(result.finalTotal).toBe(420);
  });

  it('calculates equal splits accurately and distributes remainder cents without discrepancy', () => {
    const splits = calculateEqualSplit(1000, 3);
    expect(splits.length).toBe(3);

    const sum = splits.reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(1000);
    expect(splits[0]).toBe(333.34);
    expect(splits[1]).toBe(333.33);
    expect(splits[2]).toBe(333.33);
  });
});
