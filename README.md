# Velvet Bloom Café — Digital Ordering & Operations Management Platform

> **"Sip. Savor. Bloom."**  
> *Powered by Kage Origin*

A complete, production-grade, real-time QR-based digital cafe ordering and kitchen management platform for **Velvet Bloom Café**.

---

## 🌟 Features & Capabilities

1. **Customer PWA Experience**
   - Seamless QR Code table onboarding & session identification without mandatory registration.
   - Curated menu browsing with instant categories, fuzzy search, veg/chef special filters, multi-lingual support (English, Telugu, Hindi).
   - Deep food customizations (milk choices, sweetness levels, spice preferences, extra cheeses/toppings, cooking instructions).
   - Real-time order timeline with dynamic ETA countdown and barista progress.
   - Flexible Bill Settlement with Equal Split and Item-Wise Split calculations.
   - Post-order dish rating & hospitality feedback.

2. **Chef & Kitchen Display System (KDS)**
   - Live incoming tickets with audio chime and visual alerts.
   - Order lifecycle workflow: `PENDING` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED` ➔ `COMPLETED`.
   - Real-time notification on additional items added by floor staff.
   - Clear cooking instructions and delay indicators.

3. **Waiter & Floor Station**
   - Live table floor grid with status colors (`AVAILABLE`, `OCCUPIED`, `BILL_REQUESTED`, `CLEANING`).
   - Urgent service assistance queue (Call Waiter, Water, Table Cleaning).
   - Ready-for-pickup alerts and instant "Mark Served" actions.
   - Direct addition of extra items to active table orders.

4. **Cashier & Billing Desk**
   - Real-time bill requests stream.
   - Universal search (by Bill #, Table, Customer Name, Phone).
   - Manual Bill Creator for counter orders and walk-in patrons.
   - Payment settlement across UPI / QR, Card POS, and Cash Register.

5. **Executive Owner Dashboard**
   - Rolling 15-day revenue, orders, and items sold trajectory chart with Recharts.
   - Dynamic Menu Manager (toggle availability in real-time, edit prices, add new dishes).
   - Table & QR Code management with instant PNG download and print layout.
   - Staff & Role-Based Access Control management.
   - Operational controls (Kitchen rush ordering pause toggle, prep time adjustment).

6. **System Engineering & Security**
   - Authoritative server-side price recalculation (Never trust client totals).
   - State machine enforcement on all status transitions.
   - Pub/Sub Realtime synchronization via Server-Sent Events and Supabase Realtime.
   - PWA Web App Manifest & Service Worker caching strategy.
   - Automated test suite with Vitest.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions, API Routes)
- **Language:** TypeScript 5.7+
- **Styling:** Tailwind CSS with Velvet Bloom luxury palette
- **Database:** Supabase PostgreSQL with schema migrations & seed data
- **Realtime:** Server-Sent Events (SSE) & Supabase Realtime
- **Charts:** Recharts
- **Validation:** Zod
- **Testing:** Vitest & React Testing Library
- **PWA:** Web App Manifest + Service Worker

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ or 24+
- pnpm 9+ / 12+ or npm

### 2. Environment Setup
Create a `.env.local` file based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CAFE_NAME="Velvet Bloom Café"
NEXT_PUBLIC_CAFE_TAGLINE="Sip. Savor. Bloom."
NEXT_PUBLIC_TECH_BRAND="Powered by Kage Origin"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
pnpm test
```

### 6. Build for Production
```bash
pnpm build
pnpm start
```

---

## 📱 Navigation Guide

| Role / Station | URL Path | Description |
| :--- | :--- | :--- |
| **Customer Menu** | `/` | QR-based mobile-first ordering experience |
| **Table QR Entry** | `/table/[id]` | Table token activation (e.g. `/table/vb_tbl_01_tok99a`) |
| **Cart & Checkout** | `/cart` | Order review and server-side pricing checkout |
| **Live Tracking** | `/track` | Real-time order progress timeline |
| **Bill & Split** | `/bill` | Bill request and equal split payments |
| **Feedback** | `/feedback` | 5-star dish & hospitality reviews |
| **Chef Station** | `/chef` | Kitchen Display System with live tickets |
| **Waiter Floor** | `/waiter` | Table map, service calls, and order delivery |
| **Cashier Desk** | `/cashier` | Billing desk, manual bills, and payments |
| **Executive Owner** | `/owner` | 15-day analytics, menu editor, and table QRs |

---

## 📜 Documentation

Comprehensive system architecture guides are available in the [`docs/`](./docs) directory:
- [`docs/architecture.md`](./docs/architecture.md) — System design & separation of concerns
- [`docs/database.md`](./docs/database.md) — PostgreSQL schema, migrations & relationships
- [`docs/realtime.md`](./docs/realtime.md) — Real-time event streams & reactive hooks
- [`docs/security.md`](./docs/security.md) — Pricing integrity, RBAC & server validation
- [`docs/roles.md`](./docs/roles.md) — Role-based permission matrix
- [`docs/testing.md`](./docs/testing.md) — Automated test coverage
- [`docs/deployment.md`](./docs/deployment.md) — Production deployment instructions (Vercel & Supabase)

