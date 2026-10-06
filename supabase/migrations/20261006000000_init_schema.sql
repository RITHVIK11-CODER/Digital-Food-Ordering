-- ============================================================
-- VELVET BLOOM CAFÉ — DATABASE INITIALIZATION SCHEMA
-- Brand: Velvet Bloom Café | Powered by Kage Origin
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAFE SETTINGS
CREATE TABLE IF NOT EXISTS cafe_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_name TEXT NOT NULL DEFAULT 'Velvet Bloom Café',
  tagline TEXT NOT NULL DEFAULT 'Sip. Savor. Bloom.',
  tech_brand TEXT NOT NULL DEFAULT 'Powered by Kage Origin',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- 5% GST
  service_charge_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT '₹',
  is_ordering_paused BOOLEAN NOT NULL DEFAULT FALSE,
  busy_message TEXT DEFAULT 'The kitchen is currently experiencing high demand. Orders may take slightly longer.',
  average_prep_time_minutes INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USERS / STAFF
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER', 'CUSTOMER')),
  pin_code TEXT, -- Fast pin login for POS/Kitchen
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLES
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number TEXT UNIQUE NOT NULL,
  qr_code_token TEXT UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED', 'PAYMENT_PENDING', 'PAID', 'CLEANING')) DEFAULT 'AVAILABLE',
  current_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE SESSIONS
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  guest_count INT DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key back to tables for current_session_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tables_current_session'
  ) THEN
    ALTER TABLE tables ADD CONSTRAINT fk_tables_current_session FOREIGN KEY (current_session_id) REFERENCES table_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'coffee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_veg BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_chef_special BOOLEAN NOT NULL DEFAULT FALSE,
  preparation_time_minutes INT NOT NULL DEFAULT 15,
  calories INT,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MENU TRANSLATIONS
CREATE TABLE IF NOT EXISTS menu_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('te', 'hi')), -- Telugu, Hindi
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(menu_item_id, language_code)
);

-- 8. CUSTOMIZATION GROUPS
CREATE TABLE IF NOT EXISTS customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_selectable INT NOT NULL DEFAULT 0,
  max_selectable INT NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CUSTOMIZATION OPTIONS
CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  extra_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (extra_price >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  table_id UUID NOT NULL REFERENCES tables(id),
  session_id UUID NOT NULL REFERENCES table_sessions(id),
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED', 'REJECTED')) DEFAULT 'PENDING',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  special_instructions TEXT,
  estimated_time_minutes INT DEFAULT 20,
  eta_timestamp TIMESTAMPTZ,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_staff_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  item_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  options_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  item_total NUMERIC(10,2) NOT NULL,
  special_notes TEXT,
  is_additional BOOLEAN NOT NULL DEFAULT FALSE,
  added_by_staff_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ORDER ITEM OPTIONS
CREATE TABLE IF NOT EXISTS order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  option_name TEXT NOT NULL,
  extra_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ORDER EVENTS (AUDIT TIMELINE)
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'SYSTEM', -- 'CUSTOMER', 'CHEF', 'WAITER', 'CASHIER', 'OWNER', 'SYSTEM'
  actor_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. BILLS
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  table_id UUID NOT NULL REFERENCES tables(id),
  session_id UUID NOT NULL REFERENCES table_sessions(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  service_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  split_type TEXT NOT NULL CHECK (split_type IN ('NONE', 'EQUAL', 'ITEM_WISE')) DEFAULT 'NONE',
  split_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'GENERATED', 'PAID', 'CANCELLED')) DEFAULT 'REQUESTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. BILL SPLITS
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  split_index INT NOT NULL,
  person_label TEXT NOT NULL,
  assigned_amount NUMERIC(10,2) NOT NULL,
  item_details JSONB,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID')) DEFAULT 'PENDING',
  payment_method TEXT,
  paid_at TIMESTAMPTZ
);

-- 16. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE')),
  transaction_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')) DEFAULT 'COMPLETED',
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE,
  customer_name TEXT DEFAULT 'Valued Guest',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  cafe_ambience_rating INT CHECK (cafe_ambience_rating >= 1 AND cafe_ambience_rating <= 5),
  service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_role TEXT, -- 'OWNER', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER', 'CUSTOMER'
  recipient_user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ORDER_NEW', 'ORDER_STATUS', 'ADDITIONAL_ITEM', 'BILL_REQUEST', 'SERVICE_REQUEST'
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('WATER', 'CLEANING', 'WAITER_CALL', 'BILL', 'OTHER')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ATTENDED', 'COMPLETED')) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. STAFF ACTIVITY LOG
CREATE TABLE IF NOT EXISTS staff_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE & CONCURRENCY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_table_id ON bills(table_id);
CREATE INDEX IF NOT EXISTS idx_bills_session_id ON bills(session_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role, is_read);
CREATE INDEX IF NOT EXISTS idx_table_sessions_token ON table_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id, is_available);

-- ============================================================
-- REALTIME REPLICATION CONFIGURATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE bills;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
