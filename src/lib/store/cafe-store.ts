import {
  CafeSettings,
  User,
  CafeTable,
  TableSession,
  Category,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  Bill,
  BillSplit,
  Review,
  Notification,
  ServiceRequest,
} from "@/types/database.types";
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_REVIEWS,
} from "./seed-data";
import { calculateOrderPricing, calculateEqualSplit } from "../pricing";
import { generateOrderNumber, generateBillNumber } from "../utils";

// In-Memory Transactional Store for Velvet Bloom Cafe
class CafeStore {
  private settings: CafeSettings = { ...INITIAL_SETTINGS };
  private users: User[] = [...INITIAL_USERS];
  private tables: CafeTable[] = [...INITIAL_TABLES];
  private sessions: TableSession[] = [];
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private menuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
  private orders: Order[] = [];
  private bills: Bill[] = [];
  private reviews: Review[] = [...INITIAL_REVIEWS];
  private notifications: Notification[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private listeners: Set<(event: string, data: any) => void> = new Set();

  constructor() {
    this.seedHistoricalOrders();
  }

  public subscribe(listener: (event: string, data: any) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: string, data: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.error("PubSub error:", err);
      }
    });
  }

  // 15-Day Rolling History Seeder
  private seedHistoricalOrders() {
    const now = Date.now();
    const dayMs = 86400000;

    // Generate rolling 15-day analytics seed data
    for (let day = 15; day >= 1; day--) {
      const orderCountForDay = Math.floor(25 + Math.sin(day) * 15 + (15 - day) * 3);
      const dayTimestamp = now - day * dayMs;

      for (let i = 0; i < orderCountForDay; i++) {
        const item1 = this.menuItems[i % this.menuItems.length];
        const item2 = this.menuItems[(i + 2) % this.menuItems.length];
        const qty1 = (i % 3) + 1;
        const qty2 = ((i + 1) % 2) + 1;

        const subtotal = item1.price * qty1 + item2.price * qty2;
        const tax = Math.round(subtotal * 0.05 * 100) / 100;
        const total = subtotal + tax;

        const orderDate = new Date(dayTimestamp + i * 1800000).toISOString();
        const orderId = `hist-ord-${day}-${i}`;
        const table = this.tables[i % this.tables.length];

        this.orders.push({
          id: orderId,
          order_number: `VB-H${day}${String(i).padStart(2, "0")}`,
          table_id: table.id,
          session_id: `hist-sess-${day}-${i}`,
          customer_name: `Guest ${i + 1}`,
          status: "COMPLETED",
          subtotal,
          tax,
          discount: 0,
          total,
          estimated_time_minutes: 15,
          is_manual: false,
          created_at: orderDate,
          updated_at: orderDate,
          table,
          items: [
            {
              id: `item-${orderId}-1`,
              order_id: orderId,
              menu_item_id: item1.id,
              item_name: item1.name,
              item_price: item1.price,
              quantity: qty1,
              options_price: 0,
              item_total: item1.price * qty1,
              is_additional: false,
              created_at: orderDate,
            },
            {
              id: `item-${orderId}-2`,
              order_id: orderId,
              menu_item_id: item2.id,
              item_name: item2.name,
              item_price: item2.price,
              quantity: qty2,
              options_price: 0,
              item_total: item2.price * qty2,
              is_additional: false,
              created_at: orderDate,
            },
          ],
        });
      }
    }
  }

  // CAFE SETTINGS
  public getSettings(): CafeSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<CafeSettings>): CafeSettings {
    this.settings = { ...this.settings, ...updates, updated_at: new Date().toISOString() };
    this.notify("settings.updated", this.settings);
    return this.settings;
  }

  // TABLES & SESSIONS
  public getTables(): CafeTable[] {
    return [...this.tables];
  }

  public getTableByIdOrToken(tableIdOrToken: string): CafeTable | undefined {
    return this.tables.find(
      (t) => t.id === tableIdOrToken || t.qr_code_token === tableIdOrToken || t.table_number.toLowerCase() === tableIdOrToken.toLowerCase()
    );
  }

  public updateTable(tableId: string, updates: Partial<CafeTable>): CafeTable {
    const idx = this.tables.findIndex((t) => t.id === tableId);
    if (idx === -1) throw new Error("Table not found");
    this.tables[idx] = { ...this.tables[idx], ...updates, updated_at: new Date().toISOString() };
    this.notify("table.status_changed", this.tables[idx]);
    return this.tables[idx];
  }

  public createTable(tableNumber: string, capacity: number): CafeTable {
    const newTable: CafeTable = {
      id: `c0000000-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      table_number: tableNumber,
      qr_code_token: `vb_tbl_${Math.random().toString(36).substring(2, 8)}`,
      capacity,
      status: "AVAILABLE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tables.push(newTable);
    this.notify("table.created", newTable);
    return newTable;
  }

  public getOrCreateTableSession(tableId: string, customerName?: string): TableSession {
    let session = this.sessions.find((s) => s.table_id === tableId && s.is_active);
    if (!session) {
      session = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table_id: tableId,
        session_token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        customer_name: customerName || "Valued Guest",
        guest_count: 1,
        is_active: true,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.sessions.push(session);
      this.updateTable(tableId, { status: "OCCUPIED", current_session_id: session.id });
    }
    return session;
  }

  // MENU
  public getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.display_order - b.display_order);
  }

  public createCategory(name: string, icon: string = "coffee"): Category {
    const category: Category = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      display_order: this.categories.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.categories.push(category);
    this.notify("menu.category_created", category);
    return category;
  }

  public updateCategory(categoryId: string, updates: Partial<Category>): Category {
    const idx = this.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) throw new Error("Category not found");
    this.categories[idx] = { ...this.categories[idx], ...updates, updated_at: new Date().toISOString() };
    this.notify("menu.category_updated", this.categories[idx]);
    return this.categories[idx];
  }

  public getMenuItems(categoryId?: string): MenuItem[] {
    let items = [...this.menuItems];
    if (categoryId) {
      items = items.filter((item) => item.category_id === categoryId);
    }
    return items;
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.menuItems.find((m) => m.id === id);
  }

  public createMenuItem(itemData: Omit<MenuItem, "id" | "created_at" | "updated_at" | "average_rating" | "total_reviews">): MenuItem {
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      average_rating: 5.0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.menuItems.push(newItem);
    this.notify("menu.item_created", newItem);
    return newItem;
  }

  public updateMenuItem(itemId: string, updates: Partial<MenuItem>): MenuItem {
    const idx = this.menuItems.findIndex((m) => m.id === itemId);
    if (idx === -1) throw new Error("Menu item not found");
    this.menuItems[idx] = { ...this.menuItems[idx], ...updates, updated_at: new Date().toISOString() };
    this.notify("menu.availability_changed", this.menuItems[idx]);
    return this.menuItems[idx];
  }

  public deleteMenuItem(itemId: string): boolean {
    const idx = this.menuItems.findIndex((m) => m.id === itemId);
    if (idx === -1) return false;
    this.menuItems.splice(idx, 1);
    this.notify("menu.item_deleted", { itemId });
    return true;
  }

  // ORDER CREATION WITH FULL SERVER-SIDE PRICING VALIDATION & CONCURRENCY TRANSACTION
  public createOrder(params: {
    tableId: string;
    sessionId: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialNotes?: string;
      selectedOptions?: Array<{ groupName: string; optionName: string; extraPrice: number }>;
    }>;
    specialInstructions?: string;
    isManual?: boolean;
    createdByStaffId?: string;
  }): Order {
    if (this.settings.is_ordering_paused) {
      throw new Error("Ordering is temporarily paused by the kitchen.");
    }

    const table = this.tables.find((t) => t.id === params.tableId);
    if (!table) throw new Error("Invalid table specified.");

    const pricingItemsInput = [];
    const verifiedOrderItems: OrderItem[] = [];
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Atomic server-side validation of items, prices & availability
    for (const requestedItem of params.items) {
      const dbMenuItem = this.menuItems.find((m) => m.id === requestedItem.menuItemId);
      if (!dbMenuItem) {
        throw new Error(`Item ${requestedItem.menuItemId} does not exist.`);
      }
      if (!dbMenuItem.is_available) {
        throw new Error(`Item '${dbMenuItem.name}' is currently unavailable.`);
      }

      let optionsExtraPrice = 0;
      const verifiedOptions = [];
      if (requestedItem.selectedOptions && requestedItem.selectedOptions.length > 0) {
        for (const opt of requestedItem.selectedOptions) {
          optionsExtraPrice += Number(opt.extraPrice || 0);
          verifiedOptions.push({
            id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            order_item_id: "",
            group_name: opt.groupName,
            option_name: opt.optionName,
            extra_price: opt.extraPrice,
            created_at: new Date().toISOString(),
          });
        }
      }

      const qty = Math.max(1, Math.floor(requestedItem.quantity));
      const itemTotal = (dbMenuItem.price + optionsExtraPrice) * qty;

      pricingItemsInput.push({
        unitPrice: dbMenuItem.price,
        quantity: qty,
        optionsExtraPrice,
      });

      const orderItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      verifiedOrderItems.push({
        id: orderItemId,
        order_id: orderId,
        menu_item_id: dbMenuItem.id,
        item_name: dbMenuItem.name,
        item_price: dbMenuItem.price,
        quantity: qty,
        options_price: optionsExtraPrice,
        item_total: itemTotal,
        special_notes: requestedItem.specialNotes,
        is_additional: false,
        created_at: new Date().toISOString(),
        options: verifiedOptions.map((vo) => ({ ...vo, order_item_id: orderItemId })),
      });
    }

    // Server calculates authoritative subtotal, tax and total
    const pricing = calculateOrderPricing(pricingItemsInput, this.settings.tax_rate, this.settings.service_charge_rate, 0);

    const newOrder: Order = {
      id: orderId,
      order_number: generateOrderNumber(),
      table_id: table.id,
      session_id: params.sessionId,
      customer_name: params.customerName || "Guest",
      customer_phone: params.customerPhone,
      status: "PENDING",
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      discount: 0,
      total: pricing.finalTotal,
      special_instructions: params.specialInstructions,
      estimated_time_minutes: this.settings.average_prep_time_minutes,
      is_manual: !!params.isManual,
      created_by_staff_id: params.createdByStaffId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      table,
      items: verifiedOrderItems,
      events: [
        {
          id: `ev-${Date.now()}`,
          order_id: orderId,
          new_status: "PENDING",
          actor_type: params.isManual ? "CASHIER" : "CUSTOMER",
          notes: "Order placed successfully",
          created_at: new Date().toISOString(),
        },
      ],
    };

    this.orders.unshift(newOrder);

    // Update table status if available
    this.updateTable(table.id, { status: "OCCUPIED" });

    // Publish Realtime Notification
    this.createNotification({
      recipient_role: "CHEF",
      title: `New Order: ${newOrder.order_number}`,
      message: `${table.table_number} placed an order with ${verifiedOrderItems.length} items (${this.settings.currency}${newOrder.total}).`,
      type: "ORDER_NEW",
      link: `/chef`,
      metadata: { orderId: newOrder.id, tableNumber: table.table_number },
    });

    this.notify("order.created", newOrder);
    return newOrder;
  }

  // ADD ITEM TO ACTIVE ORDER (WITH REALTIME CHEF NOTIFICATION)
  public addAdditionalItem(params: {
    orderId: string;
    menuItemId: string;
    quantity: number;
    specialNotes?: string;
    selectedOptions?: Array<{ groupName: string; optionName: string; extraPrice: number }>;
    staffId?: string;
  }): Order {
    const orderIndex = this.orders.findIndex((o) => o.id === params.orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = this.orders[orderIndex];
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status)) {
      throw new Error(`Cannot add items to an order with status ${order.status}.`);
    }

    const dbMenuItem = this.menuItems.find((m) => m.id === params.menuItemId);
    if (!dbMenuItem) throw new Error("Item not found in menu.");
    if (!dbMenuItem.is_available) throw new Error("Item is currently unavailable.");

    let optionsExtraPrice = 0;
    const verifiedOptions = [];
    if (params.selectedOptions && params.selectedOptions.length > 0) {
      for (const opt of params.selectedOptions) {
        optionsExtraPrice += Number(opt.extraPrice || 0);
        verifiedOptions.push({
          id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          order_item_id: "",
          group_name: opt.groupName,
          option_name: opt.optionName,
          extra_price: opt.extraPrice,
          created_at: new Date().toISOString(),
        });
      }
    }

    const qty = Math.max(1, Math.floor(params.quantity));
    const itemTotal = (dbMenuItem.price + optionsExtraPrice) * qty;
    const orderItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newItem: OrderItem = {
      id: orderItemId,
      order_id: order.id,
      menu_item_id: dbMenuItem.id,
      item_name: dbMenuItem.name,
      item_price: dbMenuItem.price,
      quantity: qty,
      options_price: optionsExtraPrice,
      item_total: itemTotal,
      special_notes: params.specialNotes,
      is_additional: true,
      added_by_staff_id: params.staffId,
      created_at: new Date().toISOString(),
      options: verifiedOptions.map((vo) => ({ ...vo, order_item_id: orderItemId })),
    };

    order.items = order.items ? [...order.items, newItem] : [newItem];

    // Recalculate full order totals
    const pricingInputs = order.items.map((it) => ({
      unitPrice: it.item_price,
      quantity: it.quantity,
      optionsExtraPrice: it.options_price,
    }));
    const newPricing = calculateOrderPricing(pricingInputs, this.settings.tax_rate, this.settings.service_charge_rate, order.discount);

    order.subtotal = newPricing.subtotal;
    order.tax = newPricing.tax;
    order.total = newPricing.finalTotal;
    order.updated_at = new Date().toISOString();

    // Append audit event
    order.events = order.events || [];
    order.events.push({
      id: `ev-${Date.now()}`,
      order_id: order.id,
      new_status: order.status,
      actor_type: params.staffId ? "WAITER" : "CUSTOMER",
      actor_id: params.staffId,
      notes: `Added +${qty}x ${dbMenuItem.name} (+${this.settings.currency}${itemTotal})`,
      created_at: new Date().toISOString(),
    });

    this.orders[orderIndex] = order;

    // Realtime notification to Chef
    this.createNotification({
      recipient_role: "CHEF",
      title: `Additional Item Added: ${order.order_number}`,
      message: `${order.table?.table_number || "Table"} added +${qty}x ${dbMenuItem.name}`,
      type: "ADDITIONAL_ITEM",
      link: `/chef`,
      metadata: { orderId: order.id, item: dbMenuItem.name, quantity: qty },
    });

    this.notify("order.additional_item_added", order);
    return order;
  }

  // ORDER STATUS TRANSITIONS (CONTROLLED STATE MACHINE)
  public updateOrderStatus(params: {
    orderId: string;
    newStatus: OrderStatus;
    actorType: "CHEF" | "WAITER" | "CASHIER" | "OWNER" | "SYSTEM";
    actorId?: string;
    notes?: string;
    estimatedMinutes?: number;
  }): Order {
    const orderIndex = this.orders.findIndex((o) => o.id === params.orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = this.orders[orderIndex];
    const prevStatus = order.status;

    // State machine transition validation
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ["ACCEPTED", "CANCELLED", "REJECTED"],
      ACCEPTED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["SERVED", "COMPLETED"],
      SERVED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: [],
    };

    if (!validTransitions[prevStatus].includes(params.newStatus)) {
      throw new Error(`Invalid status transition from ${prevStatus} to ${params.newStatus}.`);
    }

    order.status = params.newStatus;
    order.updated_at = new Date().toISOString();

    if (params.estimatedMinutes) {
      order.estimated_time_minutes = params.estimatedMinutes;
      order.eta_timestamp = new Date(Date.now() + params.estimatedMinutes * 60000).toISOString();
    }

    order.events = order.events || [];
    order.events.push({
      id: `ev-${Date.now()}`,
      order_id: order.id,
      previous_status: prevStatus,
      new_status: params.newStatus,
      actor_type: params.actorType,
      actor_id: params.actorId,
      notes: params.notes || `Order status updated to ${params.newStatus}`,
      created_at: new Date().toISOString(),
    });

    this.orders[orderIndex] = order;

    // Realtime Notifications
    if (params.newStatus === "READY") {
      this.createNotification({
        recipient_role: "WAITER",
        title: `Order Ready for Pickup!`,
        message: `${order.order_number} for ${order.table?.table_number || "Table"} is ready to serve.`,
        type: "ORDER_STATUS",
        link: `/waiter`,
        metadata: { orderId: order.id },
      });
    }

    this.notify(`order.${params.newStatus.toLowerCase()}`, order);
    return order;
  }

  public getOrders(filters?: { tableId?: string; sessionId?: string; status?: OrderStatus }): Order[] {
    let results = [...this.orders];
    if (filters?.tableId) {
      results = results.filter((o) => o.table_id === filters.tableId);
    }
    if (filters?.sessionId) {
      results = results.filter((o) => o.session_id === filters.sessionId);
    }
    if (filters?.status) {
      results = results.filter((o) => o.status === filters.status);
    }
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.orders.find((o) => o.id === orderId || o.order_number === orderId);
  }

  // BILLING & SPLITS
  public requestBill(params: { tableId: string; sessionId: string; splitType?: "NONE" | "EQUAL" | "ITEM_WISE"; splitCount?: number }): Bill {
    const table = this.tables.find((t) => t.id === params.tableId);
    if (!table) throw new Error("Table not found");

    // Gather active orders for table
    const tableOrders = this.orders.filter(
      (o) => o.table_id === params.tableId && o.session_id === params.sessionId && !["CANCELLED", "REJECTED"].includes(o.status)
    );

    let subtotal = 0;
    let tax = 0;
    tableOrders.forEach((o) => {
      subtotal += o.subtotal;
      tax += o.tax;
    });

    const finalTotal = subtotal + tax;
    const splitCount = params.splitCount || 1;
    const splitType = params.splitType || "NONE";

    const billId = `bill-${Date.now()}`;
    const billNumber = generateBillNumber();

    // Generate splits
    const splits: BillSplit[] = [];
    if (splitType === "EQUAL" && splitCount > 1) {
      const splitAmounts = calculateEqualSplit(finalTotal, splitCount);
      splitAmounts.forEach((amt, idx) => {
        splits.push({
          id: `split-${billId}-${idx + 1}`,
          bill_id: billId,
          split_index: idx + 1,
          person_label: `Person ${idx + 1}`,
          assigned_amount: amt,
          payment_status: "PENDING",
        });
      });
    }

    const newBill: Bill = {
      id: billId,
      bill_number: billNumber,
      order_id: tableOrders[0]?.id,
      table_id: table.id,
      session_id: params.sessionId,
      subtotal,
      tax,
      service_charge: 0,
      discount: 0,
      final_total: finalTotal,
      split_type: splitType,
      split_count: splitCount,
      status: "REQUESTED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      table,
      splits,
    };

    this.bills.unshift(newBill);
    this.updateTable(table.id, { status: "BILL_REQUESTED" });

    this.createNotification({
      recipient_role: "CASHIER",
      title: `Bill Requested: ${table.table_number}`,
      message: `${table.table_number} requested bill for ${this.settings.currency}${finalTotal}.`,
      type: "BILL_REQUEST",
      link: `/cashier`,
      metadata: { billId: newBill.id, tableNumber: table.table_number },
    });

    this.notify("bill.requested", newBill);
    return newBill;
  }

  public getBills(): Bill[] {
    return [...this.bills].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getBillById(billId: string): Bill | undefined {
    return this.bills.find((b) => b.id === billId || b.bill_number === billId);
  }

  public markBillPaid(billId: string, paymentMethod: "CASH" | "CARD" | "UPI" | "ONLINE" = "UPI"): Bill {
    const billIdx = this.bills.findIndex((b) => b.id === billId);
    if (billIdx === -1) throw new Error("Bill not found");

    const bill = this.bills[billIdx];
    bill.status = "PAID";
    bill.updated_at = new Date().toISOString();

    if (bill.splits && bill.splits.length > 0) {
      bill.splits.forEach((s) => {
        s.payment_status = "PAID";
        s.payment_method = paymentMethod;
        s.paid_at = new Date().toISOString();
      });
    }

    this.bills[billIdx] = bill;

    // Complete active orders for this table session
    this.orders
      .filter((o) => o.table_id === bill.table_id && o.session_id === bill.session_id && o.status !== "CANCELLED")
      .forEach((o) => {
        o.status = "COMPLETED";
      });

    this.updateTable(bill.table_id, { status: "CLEANING" });

    this.notify("payment.completed", bill);
    return bill;
  }

  // REVIEWS & FEEDBACK
  public createReview(params: {
    menuItemId?: string;
    orderId?: string;
    sessionId: string;
    customerName: string;
    rating: number;
    comment?: string;
    cafeAmbienceRating?: number;
    serviceRating?: number;
  }): Review {
    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      menu_item_id: params.menuItemId,
      order_id: params.orderId,
      session_id: params.sessionId,
      customer_name: params.customerName || "Valued Guest",
      rating: Math.min(5, Math.max(1, params.rating)),
      comment: params.comment,
      cafe_ambience_rating: params.cafeAmbienceRating,
      service_rating: params.serviceRating,
      is_approved: true,
      created_at: new Date().toISOString(),
    };

    this.reviews.unshift(newReview);

    // Update menu item average rating if reviewed
    if (params.menuItemId) {
      const item = this.menuItems.find((m) => m.id === params.menuItemId);
      if (item) {
        const itemReviews = this.reviews.filter((r) => r.menu_item_id === params.menuItemId);
        const avg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
        item.average_rating = Math.round(avg * 10) / 10;
        item.total_reviews = itemReviews.length;
      }
    }

    this.notify("review.created", newReview);
    return newReview;
  }

  public getReviews(): Review[] {
    return [...this.reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // SERVICE REQUESTS
  public createServiceRequest(tableId: string, sessionId: string, type: any, notes?: string): ServiceRequest {
    const table = this.tables.find((t) => t.id === tableId);
    const req: ServiceRequest = {
      id: `req-${Date.now()}`,
      table_id: tableId,
      session_id: sessionId,
      request_type: type,
      status: "PENDING",
      notes,
      created_at: new Date().toISOString(),
      table,
    };
    this.serviceRequests.unshift(req);

    this.createNotification({
      recipient_role: "WAITER",
      title: `Service Request: ${table?.table_number || "Table"}`,
      message: `Assistance requested: ${type}${notes ? ` - ${notes}` : ""}`,
      type: "SERVICE_REQUEST",
      link: "/waiter",
    });

    this.notify("service_request.created", req);
    return req;
  }

  public getServiceRequests(): ServiceRequest[] {
    return [...this.serviceRequests];
  }

  public updateServiceRequestStatus(id: string, status: any): ServiceRequest {
    const idx = this.serviceRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Request not found");
    this.serviceRequests[idx].status = status;
    this.notify("service_request.updated", this.serviceRequests[idx]);
    return this.serviceRequests[idx];
  }

  // NOTIFICATIONS
  public createNotification(data: Omit<Notification, "id" | "created_at" | "is_read">): Notification {
    const notif: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.notify("notification.created", notif);
    return notif;
  }

  public getNotifications(role?: string): Notification[] {
    if (role) {
      return this.notifications.filter((n) => !n.recipient_role || n.recipient_role === role);
    }
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.notify("notification.read", notif);
    }
  }

  // 15-DAY ROLLING ANALYTICS AGGREGATOR
  public getAnalytics() {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 86400000);

    const completedOrders = this.orders.filter(
      (o) => o.status === "COMPLETED" && new Date(o.created_at) >= fifteenDaysAgo
    );

    // Day-by-day rolling stats
    const dailyStatsMap: { [dateKey: string]: { date: string; orders: number; revenue: number; itemsSold: number } } = {};

    for (let d = 14; d >= 0; d--) {
      const targetDate = new Date(now.getTime() - d * 86400000);
      const dateKey = targetDate.toISOString().split("T")[0];
      const dateLabel = targetDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dailyStatsMap[dateKey] = { date: dateLabel, orders: 0, revenue: 0, itemsSold: 0 };
    }

    const itemSalesCount: { [itemName: string]: { name: string; count: number; revenue: number } } = {};

    let totalRevenue = 0;
    let totalItemsCount = 0;

    completedOrders.forEach((ord) => {
      const dateKey = ord.created_at.split("T")[0];
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].orders += 1;
        dailyStatsMap[dateKey].revenue += ord.total;
      }
      totalRevenue += ord.total;

      ord.items?.forEach((item) => {
        totalItemsCount += item.quantity;
        if (dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey].itemsSold += item.quantity;
        }

        if (!itemSalesCount[item.item_name]) {
          itemSalesCount[item.item_name] = { name: item.item_name, count: 0, revenue: 0 };
        }
        itemSalesCount[item.item_name].count += item.quantity;
        itemSalesCount[item.item_name].revenue += item.item_total;
      });
    });

    const topSellingItems = Object.values(itemSalesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const chartData = Object.values(dailyStatsMap);

    const todayKey = now.toISOString().split("T")[0];
    const todayStats = dailyStatsMap[todayKey] || { orders: 0, revenue: 0, itemsSold: 0 };

    return {
      today: {
        revenue: todayStats.revenue,
        orders: todayStats.orders,
        itemsSold: todayStats.itemsSold,
        averageOrderValue: todayStats.orders > 0 ? Math.round(todayStats.revenue / todayStats.orders) : 0,
      },
      fifteenDaysTotal: {
        revenue: totalRevenue,
        orders: completedOrders.length,
        itemsSold: totalItemsCount,
        averageOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
      },
      dailyTrend: chartData,
      topSellingItems,
      activeOrdersCount: this.orders.filter((o) => ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status)).length,
      preparingCount: this.orders.filter((o) => o.status === "PREPARING").length,
      readyCount: this.orders.filter((o) => o.status === "READY").length,
    };
  }

  // STAFF
  public getUsers(): User[] {
    return [...this.users];
  }

  public createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found");
    this.users[idx] = { ...this.users[idx], ...updates, updated_at: new Date().toISOString() };
    return this.users[idx];
  }
}

// Global Singleton Store Instance
const globalForCafe = globalThis as unknown as { cafeStore: CafeStore };
export const cafeStore = globalForCafe.cafeStore || new CafeStore();
if (process.env.NODE_ENV !== "production") globalForCafe.cafeStore = cafeStore;

