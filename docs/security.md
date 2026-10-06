# Security & Concurrency Design — Velvet Bloom Café

## 1. Zero Trust Client Pricing
Client requests submit only `menuItemId`, `quantity`, and selected `optionNames`. The backend server retrieves authoritative item prices, verifies availability, computes exact item totals, taxes (5% GST), and generates immutable order items.

## 2. Concurrency & Idempotency
- **Double Submissions:** Disabled UI buttons + server request deduplication prevents duplicate tickets.
- **Race Condition Protection:** Orders are verified against active table sessions. If a table session has already closed or moved to `CLEANING`, new order placements are rejected.
- **Controlled State Machine:** Order transitions are strictly linear (`PENDING` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED` ➔ `COMPLETED`). Arbitrary status jumps are blocked server-side.

## 3. Secret Management
Database service role keys, VAPID push keys, and administration tokens are strictly kept in environment variables and are never bundled into client distributions.

