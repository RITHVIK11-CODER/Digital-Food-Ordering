export type UserRole = 'OWNER' | 'MANAGER' | 'CHEF' | 'WAITER' | 'CASHIER' | 'CUSTOMER';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'PAYMENT_PENDING' | 'PAID' | 'CLEANING';

export type OrderStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'PREPARING' 
  | 'READY' 
  | 'SERVED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED';

export type SplitType = 'NONE' | 'EQUAL' | 'ITEM_WISE';

export type BillStatus = 'REQUESTED' | 'GENERATED' | 'PAID' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE';

export type ServiceRequestType = 'WATER' | 'CLEANING' | 'WAITER_CALL' | 'BILL' | 'OTHER';

export type ServiceRequestStatus = 'PENDING' | 'ATTENDED' | 'COMPLETED';

export interface CafeSettings {
  id: string;
  cafe_name: string;
  tagline: string;
  tech_brand: string;
  tax_rate: number;
  service_charge_rate: number;
  currency: string;
  is_ordering_paused: boolean;
  busy_message: string;
  average_prep_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id?: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  pin_code?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CafeTable {
  id: string;
  table_number: string;
  qr_code_token: string;
  capacity: number;
  status: TableStatus;
  current_session_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  session_token: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  guest_count: number;
  is_active: boolean;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomizationOption {
  id: string;
  group_id: string;
  name: string;
  extra_price: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface CustomizationGroup {
  id: string;
  menu_item_id: string;
  name: string;
  min_selectable: number;
  max_selectable: number;
  is_required: boolean;
  display_order: number;
  created_at: string;
  options?: CustomizationOption[];
}

export interface MenuTranslation {
  id: string;
  menu_item_id: string;
  language_code: 'te' | 'hi';
  name: string;
  description?: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  is_chef_special: boolean;
  preparation_time_minutes: number;
  calories?: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  customization_groups?: CustomizationGroup[];
  translations?: MenuTranslation[];
}

export interface OrderItemOption {
  id: string;
  order_item_id: string;
  group_name: string;
  option_name: string;
  extra_price: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  options_price: number;
  item_total: number;
  special_notes?: string;
  is_additional: boolean;
  added_by_staff_id?: string | null;
  created_at: string;
  options?: OrderItemOption[];
}

export interface OrderEvent {
  id: string;
  order_id: string;
  previous_status?: OrderStatus | null;
  new_status: OrderStatus;
  actor_type: 'CUSTOMER' | 'CHEF' | 'WAITER' | 'CASHIER' | 'OWNER' | 'SYSTEM';
  actor_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  session_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  special_instructions?: string | null;
  estimated_time_minutes: number;
  eta_timestamp?: string | null;
  is_manual: boolean;
  created_by_staff_id?: string | null;
  created_at: string;
  updated_at: string;
  table?: CafeTable;
  items?: OrderItem[];
  events?: OrderEvent[];
}

export interface BillSplit {
  id: string;
  bill_id: string;
  split_index: number;
  person_label: string;
  assigned_amount: number;
  item_details?: any;
  payment_status: 'PENDING' | 'PAID';
  payment_method?: string | null;
  paid_at?: string | null;
}

export interface Bill {
  id: string;
  bill_number: string;
  order_id?: string | null;
  table_id: string;
  session_id: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  final_total: number;
  split_type: SplitType;
  split_count: number;
  status: BillStatus;
  created_at: string;
  updated_at: string;
  table?: CafeTable;
  order?: Order;
  splits?: BillSplit[];
}

export interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  recorded_by?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  menu_item_id?: string | null;
  order_id?: string | null;
  session_id: string;
  customer_name: string;
  rating: number;
  comment?: string | null;
  cafe_ambience_rating?: number | null;
  service_rating?: number | null;
  is_approved: boolean;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Notification {
  id: string;
  recipient_role?: UserRole | null;
  recipient_user_id?: string | null;
  title: string;
  message: string;
  type: 'ORDER_NEW' | 'ORDER_STATUS' | 'ADDITIONAL_ITEM' | 'BILL_REQUEST' | 'SERVICE_REQUEST' | 'INFO';
  link?: string | null;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  table_id: string;
  session_id: string;
  request_type: ServiceRequestType;
  status: ServiceRequestStatus;
  notes?: string | null;
  created_at: string;
  table?: CafeTable;
}

