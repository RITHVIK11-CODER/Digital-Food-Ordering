# Realtime Architecture — Velvet Bloom Café

The Velvet Bloom Café platform utilizes real-time publish-subscribe communication via **Server-Sent Events (SSE)** and **Supabase Realtime** to guarantee instant, zero-refresh updates across all stations.

## Realtime Events Catalog

| Event Name | Dispatched When | Target Consumers |
| :--- | :--- | :--- |
| `order.created` | Customer submits order | Chef Station, Cashier Desk, Owner |
| `order.accepted` | Chef acknowledges ticket | Customer Timeline, Floor Station |
| `order.preparing` | Chef begins cooking | Customer Timeline |
| `order.ready` | Chef marks order ready | Waiter Floor Station, Customer |
| `order.served` | Waiter delivers items | Customer Timeline, Cashier Desk |
| `order.completed` | Order fully concluded | Customer, Owner Analytics |
| `order.additional_item_added` | Floor staff adds item to active order | Chef Station, Customer Tracker |
| `bill.requested` | Customer requests bill | Cashier Desk, Waiter Station |
| `payment.completed` | Cashier/Customer settles bill | Customer, Table Floor Map |
| `service_request.created` | Customer calls waiter/water | Waiter Floor Station |
| `service_request.updated` | Staff attends request | Waiter Floor Station |
| `table.status_changed` | Table occupancy status updates | Floor Map, Cashier Desk |
| `menu.availability_changed` | Owner toggles item sold out | Customer Menu, Cashier Desk |
| `settings.updated` | Owner changes busy/pause state | Customer Menu, Chef Station |

## Client Reconnection Protocol

The `useRealtime` hook continuously monitors connection health. If connection drops:
1. Reconnects automatically with an exponential backoff retry.
2. Performs an authoritative state synchronization from the API upon reconnection.

