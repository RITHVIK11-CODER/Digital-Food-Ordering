# Testing Strategy & Automated Test Suite

The platform utilizes **Vitest** and **React Testing Library** to ensure total correctness of calculations, validations, and operational flows.

## Test Execution

Run the full automated test suite:
```bash
pnpm test
```

## Covered Test Suites

1. **`tests/unit/pricing.test.ts`**
   - Subtotal, 5% GST tax, and total computation with base items and multi-level customizations.
   - Promotional discount validation and non-negative total enforcement.
   - Equal split calculations with exact zero-discrepancy cent distribution.

2. **`tests/unit/status-transitions.test.ts`**
   - Linear order progression (`PENDING` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED` ➔ `COMPLETED`).
   - Server-side rejection of illegal skipping transitions (e.g. `PENDING` directly to `SERVED`).

3. **`tests/integration/additional-items.test.ts`**
   - Live order item additions by floor staff.
   - Dynamic recalculation of order totals and automatic audit timeline logging.

