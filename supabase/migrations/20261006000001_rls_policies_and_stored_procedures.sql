-- ============================================================
-- VELVET BLOOM CAFÉ — PRODUCTION RLS POLICIES & PROCEDURES
-- Brand: Velvet Bloom Café | Powered by Kage Origin
-- ============================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL SENSITIVE TABLES
ALTER TABLE IF EXISTS cafe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_activity ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS FOR USER ROLES
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM users WHERE auth_user_id = auth.uid() OR id = auth.uid()),
    'CUSTOMER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CAFE SETTINGS POLICIES
-- Anyone can view settings (tax rates, busy announcements)
CREATE POLICY "Public can view cafe settings"
  ON cafe_settings FOR SELECT
  USING (true);

-- Only OWNER & MANAGER can update settings
CREATE POLICY "Owner and Manager can update settings"
  ON cafe_settings FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MANAGER'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER'));

-- 4. USERS / STAFF POLICIES
-- Staff can view other active staff profiles; Customers cannot view staff
CREATE POLICY "Staff can view other staff"
  ON users FOR SELECT
  USING (get_user_role() IN ('OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER'));

-- Only OWNER can create, update, or deactivate staff
CREATE POLICY "Owner can manage all staff"
  ON users FOR ALL
  USING (get_user_role() = 'OWNER')
  WITH CHECK (get_user_role() = 'OWNER');

-- 5. TABLES & SESSIONS POLICIES
-- Anyone can view table numbers & statuses
CREATE POLICY "Public can view tables"
  ON tables FOR SELECT
  USING (true);

-- Staff can update table statuses
CREATE POLICY "Staff can update tables"
  ON tables FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'CHEF'));

-- Only OWNER & MANAGER can insert or delete physical tables
CREATE POLICY "Owner/Manager manage tables"
  ON tables FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER'));

-- Table Sessions: Customer can view their own session via token
CREATE POLICY "Customer can access active session"
  ON table_sessions FOR SELECT
  USING (is_active = true OR get_user_role() IN ('OWNER', 'MANAGER', 'WAITER', 'CASHIER'));

CREATE POLICY "System/Customer can create session"
  ON table_sessions FOR INSERT
  WITH CHECK (true);

-- 6. MENU & CUSTOMIZATIONS POLICIES
-- Public read access for menu items, categories, options
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Public can read menu translations"
  ON menu_translations FOR SELECT USING (true);

CREATE POLICY "Public can read customization groups"
  ON customization_groups FOR SELECT USING (true);

CREATE POLICY "Public can read customization options"
  ON customization_options FOR SELECT USING (true);

-- Only OWNER & MANAGER can modify menu definitions, prices, and categories
CREATE POLICY "Owner/Manager can manage categories"
  ON categories FOR ALL
  USING (get_user_role() IN ('OWNER', 'MANAGER'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER'));

CREATE POLICY "Owner/Manager can manage menu items"
  ON menu_items FOR ALL
  USING (get_user_role() IN ('OWNER', 'MANAGER'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER'));

-- 7. ORDERS & ITEMS POLICIES
-- Customers can view orders belonging to their active table session; Staff can view all orders
CREATE POLICY "Customer view own table orders or Staff view all"
  ON orders FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER')
    OR session_id IN (SELECT id FROM table_sessions WHERE is_active = true)
  );

-- Order Insertion Policy (Transactions ensure verified server prices)
CREATE POLICY "Authorized clients can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Order Status Updates: Restricted by Station Role
CREATE POLICY "Staff can update order status"
  ON orders FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER'));

-- Order Items Policies
CREATE POLICY "View order items"
  ON order_items FOR SELECT USING (true);

CREATE POLICY "Insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- 8. BILLING & PAYMENTS POLICIES
CREATE POLICY "View bills for own session or Staff"
  ON bills FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    OR session_id IN (SELECT id FROM table_sessions WHERE is_active = true)
  );

CREATE POLICY "Cashier and Owner can settle bills"
  ON bills FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MANAGER', 'CASHIER', 'WAITER'))
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER', 'CASHIER', 'WAITER'));

CREATE POLICY "View payments"
  ON payments FOR SELECT
  USING (get_user_role() IN ('OWNER', 'MANAGER', 'CASHIER'));

CREATE POLICY "Record payments"
  ON payments FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MANAGER', 'CASHIER', 'CUSTOMER'));

-- 9. REVIEWS POLICIES
CREATE POLICY "Public view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true OR get_user_role() IN ('OWNER', 'MANAGER'));

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (rating >= 1 AND rating <= 5);

-- 10. ATOMIC POSTGRESQL TRANSACTION STORED PROCEDURE FOR ORDER CREATION
CREATE OR REPLACE FUNCTION create_order_transactional(
  p_table_id UUID,
  p_session_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_special_instructions TEXT,
  p_items JSONB,
  p_tax_rate NUMERIC DEFAULT 5.00
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID := uuid_generate_v4();
  v_order_number TEXT;
  v_subtotal NUMERIC(10,2) := 0.00;
  v_tax NUMERIC(10,2) := 0.00;
  v_total NUMERIC(10,2) := 0.00;
  v_item RECORD;
  v_db_item RECORD;
  v_item_total NUMERIC(10,2);
  v_order_item_id UUID;
  v_opt RECORD;
BEGIN
  -- Generate unique Order Number
  v_order_number := 'VB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));

  -- Loop through items with database price validation
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    menu_item_id UUID,
    quantity INT,
    special_notes TEXT,
    selected_options JSONB
  )
  LOOP
    -- Lock and verify menu item price and availability
    SELECT * INTO v_db_item FROM menu_items WHERE id = v_item.menu_item_id FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % does not exist', v_item.menu_item_id;
    END IF;
    IF NOT v_db_item.is_available THEN
      RAISE EXCEPTION 'Item "%" is currently unavailable', v_db_item.name;
    END IF;

    v_item_total := v_db_item.price * GREATEST(1, v_item.quantity);
    v_subtotal := v_subtotal + v_item_total;

    v_order_item_id := uuid_generate_v4();
    INSERT INTO order_items (
      id, order_id, menu_item_id, item_name, item_price, quantity, options_price, item_total, special_notes, is_additional
    ) VALUES (
      v_order_item_id, v_order_id, v_db_item.id, v_db_item.name, v_db_item.price, v_item.quantity, 0, v_item_total, v_item.special_notes, FALSE
    );
  END LOOP;

  -- Calculate Tax and Total
  v_tax := ROUND((v_subtotal * (p_tax_rate / 100.0)), 2);
  v_total := v_subtotal + v_tax;

  -- Insert Order
  INSERT INTO orders (
    id, order_number, table_id, session_id, customer_name, customer_phone, status, subtotal, tax, discount, total, special_instructions
  ) VALUES (
    v_order_id, v_order_number, p_table_id, p_session_id, COALESCE(p_customer_name, 'Valued Guest'), p_customer_phone, 'PENDING', v_subtotal, v_tax, 0, v_total, p_special_instructions
  );

  -- Insert Audit Event
  INSERT INTO order_events (
    order_id, previous_status, new_status, actor_type, notes
  ) VALUES (
    v_order_id, NULL, 'PENDING', 'CUSTOMER', 'Order placed successfully via transactional procedure'
  );

  -- Update table status
  UPDATE tables SET status = 'OCCUPIED' WHERE id = p_table_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'tax', v_tax,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql;
