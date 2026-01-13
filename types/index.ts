export type UserRole = 'customer' | 'admin' | 'driver' | 'agent'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export type StoreCategory = 'tuck_shop' | 'takeaways' | 'alcohol' | 'groceries' | 'restaurant' | 'other'
export type StoreStatus = 'active' | 'pending' | 'inactive'
export type Township = 'modimolle' | 'phagameng' | 'leseding' | 'bela_bela'

export type OrderType = 'product_order' | 'custom_request' | 'cash_purchase' | 'assisted_purchase'
export type OrderStatus = 'pending' | 'assigned' | 'cash_requested' | 'cash_approved' | 'received' | 'purchased' | 'on_the_way' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'yoco' | 'cash' | 'company_cash' | 'company_card'
export type PurchaseType = 'CPO' | 'APO' // Cash Purchase Order, Assisted Purchase Order
export type TransactionType = 'cash_released' | 'purchase_made' | 'balance_adjustment' | 'reconciliation'

export interface User {
  id: string
  email: string
  full_name: string
  phone_number?: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  name: string
  category: StoreCategory
  phone_number: string
  description?: string
  street_address: string
  township: string
  town: Township
  gps_latitude?: number
  gps_longitude?: number
  open_time?: string
  close_time?: string
  operating_days: string
  logo_url?: string
  status: StoreStatus
  custom_orders_only: boolean
  access_code?: string
  // Banking details
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  account_type?: 'savings' | 'current' | 'cheque'
  branch_code?: string
  banking_details_verified?: boolean
  banking_details_updated_at?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  category: string
  category_id?: string | null
  image_url?: string
  available: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  store_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  store_id: string
  driver_id?: string
  agent_id?: string
  order_type: OrderType
  purchase_type?: PurchaseType
  custom_request_text?: string
  total_amount: number
  estimated_amount?: number
  actual_amount?: number
  delivery_fee: number
  delivery_address: string
  delivery_township: string
  delivery_gps_latitude?: number
  delivery_gps_longitude?: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  proof_of_purchase_url?: string
  delivery_photo_url?: string
  notes?: string
  store_notes?: string
  cash_released?: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  product?: {
    id: string
    name?: string
    image_url?: string
  }
  products?: {
    id: string
    name?: string
    image_url?: string
  }
}

// Agent-specific types
export type AgentStatus = 'active' | 'temporarily_suspended' | 'blacklisted'

export interface AgentProfile {
  id: string
  agent_id: string
  id_number?: string
  profile_photo_url?: string
  home_area?: string
  township?: string
  agent_status: AgentStatus
  is_online: boolean
  orders_completed: number
  orders_cancelled: number
  receipt_issues: number
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface AgentWithProfile extends User {
  profile?: AgentProfile
  wallet?: AgentWallet
}

export interface AgentWallet {
  id: string
  agent_id: string
  company_cash_balance: number
  max_cash_limit: number
  status: 'active' | 'frozen' | 'suspended'
  created_at: string
  updated_at: string
}

export interface AgentTransaction {
  id: string
  agent_id: string
  order_id?: string
  transaction_type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
}

export interface OrderWithDetails extends Order {
  store?: Store
  customer?: User
  agent?: User
  items?: Array<OrderItem & { product?: { id: string; name?: string; image_url?: string } }>
  distance?: number
}
