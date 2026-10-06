import { getAdminSupabaseClient } from "./admin";
import {
  CafeSettings,
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
  ServiceRequest,
  User,
} from "@/types/database.types";
import { calculateOrderPricing, calculateEqualSplit } from "../pricing";
import { generateOrderNumber, generateBillNumber } from "../utils";

/**
 * Authoritative Supabase PostgreSQL Database Repository Layer.
 * All mutations and queries run directly against Supabase PostgreSQL.
 */

// CAFE SETTINGS
export async function getSettingsFromDb(): Promise<CafeSettings | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("cafe_settings").select("*").limit(1).single();
  if (error) {
    console.error("getSettingsFromDb error:", error.message);
    return null;
  }
  return data;
}

export async function updateSettingsInDb(updates: Partial<CafeSettings>): Promise<CafeSettings | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cafe_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error("updateSettingsInDb error:", error.message);
    return null;
  }
  return data;
}

// TABLES & SESSIONS
export async function getTablesFromDb(): Promise<CafeTable[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("tables").select("*").order("table_number");
  if (error) {
    console.error("getTablesFromDb error:", error.message);
    return [];
  }
  return data || [];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTableByIdOrTokenFromDb(idOrToken: string): Promise<CafeTable | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase || !idOrToken) return null;

  // 1. Primary secure QR token lookup
  const { data: byToken, error: tokenErr } = await supabase
    .from("tables")
    .select("*")
    .eq("qr_code_token", idOrToken)
    .limit(1)
    .maybeSingle();

  if (byToken) return byToken;

  // 2. Fallback lookup: only if idOrToken is a valid UUID format
  if (UUID_REGEX.test(idOrToken)) {
    const { data: byId, error: idErr } = await supabase
      .from("tables")
      .select("*")
      .eq("id", idOrToken)
      .limit(1)
      .maybeSingle();

    if (byId) return byId;
  }

  return null;
}

export async function updateTableInDb(tableId: string, updates: Partial<CafeTable>): Promise<CafeTable | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tables")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", tableId)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function createTableInDb(tableNumber: string, capacity: number): Promise<CafeTable | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const qrToken = `vb_tbl_${Math.random().toString(36).substring(2, 8)}`;
  const { data, error } = await supabase
    .from("tables")
    .insert({
      table_number: tableNumber,
      qr_code_token: qrToken,
      capacity,
      status: "AVAILABLE",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getOrCreateTableSessionInDb(tableId: string, customerName?: string): Promise<TableSession | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  // Check active session
  const { data: existing } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", tableId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (existing) return existing;

  const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({
      table_id: tableId,
      session_token: sessionToken,
      customer_name: customerName || "Valued Guest",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update table status
  await supabase.from("tables").update({ status: "OCCUPIED", current_session_id: created.id }).eq("id", tableId);

  return created;
}

// MENU
export async function getCategoriesFromDb(): Promise<Category[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("categories").select("*").order("display_order");
  if (error) return [];
  return data || [];
}

export async function getMenuItemsFromDb(categoryId?: string): Promise<MenuItem[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("menu_items")
    .select(`
      *,
      translations:menu_translations(*),
      customization_groups(*, options:customization_options(*))
    `)
    .order("name");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getMenuItemsFromDb error:", error.message);
    return [];
  }
  return data || [];
}

export async function getMenuItemByIdFromDb(id: string): Promise<MenuItem | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("menu_items")
    .select(`
      *,
      translations:menu_translations(*),
      customization_groups(*, options:customization_options(*))
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function updateMenuItemInDb(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("menu_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function createMenuItemInDb(itemData: any): Promise<MenuItem | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: itemData.category_id,
      name: itemData.name,
      description: itemData.description,
      price: itemData.price,
      image_url: itemData.image_url,
      is_veg: itemData.is_veg ?? true,
      is_available: true,
      is_bestseller: itemData.is_bestseller ?? false,
      is_chef_special: itemData.is_chef_special ?? false,
      preparation_time_minutes: itemData.preparation_time_minutes ?? 15,
      calories: itemData.calories,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ORDER CREATION & MANAGEMENT
export async function createOrderInDb(params: {
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
}): Promise<Order> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  // Verify settings & pause state
  const settings = await getSettingsFromDb();
  if (settings?.is_ordering_paused) {
    throw new Error("Ordering is temporarily paused by the kitchen.");
  }

  const taxRate = settings?.tax_rate ?? 5.0;
  const serviceChargeRate = settings?.service_charge_rate ?? 0.0;

  // Retrieve items from DB to enforce authoritative prices
  const itemIds = params.items.map((i) => i.menuItemId);
  const { data: dbItems, error: itemsErr } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", itemIds);

  if (itemsErr || !dbItems || dbItems.length === 0) {
    throw new Error("Invalid menu items specified");
  }

  const pricingInputs = [];
  const verifiedItemsToInsert = [];

  for (const requested of params.items) {
    const dbItem = dbItems.find((m) => m.id === requested.menuItemId);
    if (!dbItem) throw new Error(`Item ${requested.menuItemId} does not exist`);
    if (!dbItem.is_available) throw new Error(`Item '${dbItem.name}' is currently unavailable`);

    const extraPrice = requested.selectedOptions?.reduce((sum, opt) => sum + Number(opt.extraPrice || 0), 0) || 0;
    const qty = Math.max(1, Math.floor(requested.quantity));
    const itemTotal = (Number(dbItem.price) + extraPrice) * qty;

    pricingInputs.push({
      unitPrice: Number(dbItem.price),
      quantity: qty,
      optionsExtraPrice: extraPrice,
    });

    verifiedItemsToInsert.push({
      menu_item_id: dbItem.id,
      item_name: dbItem.name,
      item_price: dbItem.price,
      quantity: qty,
      options_price: extraPrice,
      item_total: itemTotal,
      special_notes: requested.specialNotes,
      is_additional: false,
      selected_options: requested.selectedOptions || [],
    });
  }

  const pricing = calculateOrderPricing(pricingInputs, taxRate, serviceChargeRate, 0);
  const orderNumber = generateOrderNumber();

  // Insert Order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      table_id: params.tableId,
      session_id: params.sessionId,
      customer_name: params.customerName || "Valued Guest",
      customer_phone: params.customerPhone,
      status: "PENDING",
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      discount: 0,
      total: pricing.finalTotal,
      special_instructions: params.specialInstructions,
      estimated_time_minutes: settings?.average_prep_time_minutes || 15,
      is_manual: !!params.isManual,
      created_by_staff_id: params.createdByStaffId,
    })
    .select("*, table:tables(*)")
    .single();

  if (orderErr) throw new Error(orderErr.message);

  // Insert Order Items and Options
  for (const it of verifiedItemsToInsert) {
    const { data: insertedItem, error: itErr } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        menu_item_id: it.menu_item_id,
        item_name: it.item_name,
        item_price: it.item_price,
        quantity: it.quantity,
        options_price: it.options_price,
        item_total: it.item_total,
        special_notes: it.special_notes,
        is_additional: false,
      })
      .select()
      .single();

    if (insertedItem && it.selected_options.length > 0) {
      const optionsToInsert = it.selected_options.map((opt: any) => ({
        order_item_id: insertedItem.id,
        group_name: opt.groupName,
        option_name: opt.optionName,
        extra_price: opt.extraPrice,
      }));
      await supabase.from("order_item_options").insert(optionsToInsert);
    }
  }

  // Insert Audit Event
  await supabase.from("order_events").insert({
    order_id: order.id,
    new_status: "PENDING",
    actor_type: params.isManual ? "CASHIER" : "CUSTOMER",
    notes: "Order placed successfully",
  });

  // Update table status
  await supabase.from("tables").update({ status: "OCCUPIED" }).eq("id", params.tableId);

  // Return full order
  return getOrderByIdFromDb(order.id) as Promise<Order>;
}

export async function getOrdersFromDb(filters?: { tableId?: string; sessionId?: string; status?: OrderStatus }): Promise<Order[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("orders")
    .select(`
      *,
      table:tables(*),
      items:order_items(*, options:order_item_options(*)),
      events:order_events(*)
    `)
    .order("created_at", { ascending: false });

  if (filters?.tableId) query = query.eq("table_id", filters.tableId);
  if (filters?.sessionId) query = query.eq("session_id", filters.sessionId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("getOrdersFromDb error:", error.message);
    return [];
  }
  return data || [];
}

export async function getOrderByIdFromDb(orderId: string): Promise<Order | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      table:tables(*),
      items:order_items(*, options:order_item_options(*)),
      events:order_events(*)
    `)
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .single();

  if (error) return null;
  return data;
}

export async function updateOrderStatusInDb(params: {
  orderId: string;
  newStatus: OrderStatus;
  actorType: "CHEF" | "WAITER" | "CASHIER" | "OWNER" | "SYSTEM";
  actorId?: string;
  notes?: string;
  estimatedMinutes?: number;
}): Promise<Order | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const currentOrder = await getOrderByIdFromDb(params.orderId);
  if (!currentOrder) throw new Error("Order not found");

  const updates: any = {
    status: params.newStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.estimatedMinutes) {
    updates.estimated_time_minutes = params.estimatedMinutes;
    updates.eta_timestamp = new Date(Date.now() + params.estimatedMinutes * 60000).toISOString();
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", currentOrder.id);
  if (error) throw new Error(error.message);

  // Insert Audit Event
  await supabase.from("order_events").insert({
    order_id: currentOrder.id,
    previous_status: currentOrder.status,
    new_status: params.newStatus,
    actor_type: params.actorType,
    notes: params.notes || `Order status transitioned to ${params.newStatus}`,
  });

  return getOrderByIdFromDb(currentOrder.id);
}

// BILLING & PAYMENTS
export async function requestBillInDb(params: {
  tableId: string;
  sessionId: string;
  splitType?: "NONE" | "EQUAL" | "ITEM_WISE";
  splitCount?: number;
}): Promise<Bill> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  // Get active orders for table & session
  const { data: tableOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("table_id", params.tableId)
    .eq("session_id", params.sessionId)
    .not("status", "in", '("CANCELLED","REJECTED")');

  let subtotal = 0;
  let tax = 0;
  tableOrders?.forEach((o) => {
    subtotal += Number(o.subtotal || 0);
    tax += Number(o.tax || 0);
  });

  const finalTotal = subtotal + tax;
  const billNumber = generateBillNumber();
  const splitType = params.splitType || "NONE";
  const splitCount = params.splitCount || 1;

  const { data: bill, error: billErr } = await supabase
    .from("bills")
    .insert({
      bill_number: billNumber,
      order_id: tableOrders?.[0]?.id,
      table_id: params.tableId,
      session_id: params.sessionId,
      subtotal,
      tax,
      service_charge: 0,
      discount: 0,
      final_total: finalTotal,
      split_type: splitType,
      split_count: splitCount,
      status: "REQUESTED",
    })
    .select("*, table:tables(*)")
    .single();

  if (billErr) throw new Error(billErr.message);

  // Equal Splits
  if (splitType === "EQUAL" && splitCount > 1) {
    const splitAmounts = calculateEqualSplit(finalTotal, splitCount);
    const splitsToInsert = splitAmounts.map((amt, idx) => ({
      bill_id: bill.id,
      split_index: idx + 1,
      person_label: `Person ${idx + 1}`,
      assigned_amount: amt,
      payment_status: "PENDING",
    }));
    await supabase.from("bill_splits").insert(splitsToInsert);
  }

  // Update table status
  await supabase.from("tables").update({ status: "BILL_REQUESTED" }).eq("id", params.tableId);

  return getBillByIdFromDb(bill.id) as Promise<Bill>;
}

export async function getBillsFromDb(): Promise<Bill[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bills")
    .select(`*, table:tables(*), splits:bill_splits(*)`)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getBillByIdFromDb(billId: string): Promise<Bill | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bills")
    .select(`*, table:tables(*), splits:bill_splits(*)`)
    .or(`id.eq.${billId},bill_number.eq.${billId}`)
    .single();

  if (error) return null;
  return data;
}

export async function markBillPaidInDb(billId: string, paymentMethod: "CASH" | "CARD" | "UPI" = "UPI"): Promise<Bill> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const currentBill = await getBillByIdFromDb(billId);
  if (!currentBill) throw new Error("Bill not found");

  await supabase
    .from("bills")
    .update({ status: "PAID", updated_at: new Date().toISOString() })
    .eq("id", currentBill.id);

  // Update splits
  await supabase
    .from("bill_splits")
    .update({ payment_status: "PAID", payment_method: paymentMethod, paid_at: new Date().toISOString() })
    .eq("bill_id", currentBill.id);

  // Record payment
  await supabase.from("payments").insert({
    bill_id: currentBill.id,
    amount: currentBill.final_total,
    payment_method: paymentMethod,
    status: "COMPLETED",
  });

  // Mark table cleaning
  await supabase.from("tables").update({ status: "CLEANING" }).eq("id", currentBill.table_id);

  // Complete orders for this session
  await supabase
    .from("orders")
    .update({ status: "COMPLETED" })
    .eq("table_id", currentBill.table_id)
    .eq("session_id", currentBill.session_id)
    .neq("status", "CANCELLED");

  return getBillByIdFromDb(currentBill.id) as Promise<Bill>;
}

// REVIEWS
export async function createReviewInDb(params: any): Promise<Review> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      menu_item_id: params.menuItemId || null,
      order_id: params.orderId || null,
      session_id: params.sessionId,
      customer_name: params.customerName || "Valued Guest",
      rating: params.rating,
      comment: params.comment,
      cafe_ambience_rating: params.cafeAmbienceRating,
      service_rating: params.serviceRating,
      is_approved: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getReviewsFromDb(): Promise<Review[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("*, menu_item:menu_items(*)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// SERVICE REQUESTS
export async function createServiceRequestInDb(tableId: string, sessionId: string, type: any, notes?: string): Promise<ServiceRequest> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      table_id: tableId,
      session_id: sessionId,
      request_type: type,
      status: "PENDING",
      notes,
    })
    .select("*, table:tables(*)")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getServiceRequestsFromDb(): Promise<ServiceRequest[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("service_requests")
    .select("*, table:tables(*)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function updateServiceRequestStatusInDb(id: string, status: any): Promise<ServiceRequest> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data, error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", id)
    .select("*, table:tables(*)")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// USERS & STAFF
export async function getUsersFromDb(): Promise<User[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("users").select("*").order("full_name");
  if (error) return [];
  return data || [];
}

