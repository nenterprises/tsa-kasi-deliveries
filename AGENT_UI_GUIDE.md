# Agent UI - Complete Documentation

## Overview

The Agent UI is a comprehensive delivery management system for agents handling Cash Purchase Orders (CPO) and Assisted Purchase Orders (APO). It includes cash wallet management, order tracking, and a complete workflow from job acceptance to delivery.

## Features Implemented

### 1. Authentication
- **Location**: `/agent/login`
- Email + password authentication
- Role verification (agent only)
- Account status check (must be active)
- Automatic redirect to agent home after login

### 2. Agent Home Screen
- **Location**: `/agent`
- **Tabs**:
  - Available Jobs
  - My Active Job
  - Cash Wallet
  - History
- Real-time cash balance display
- Agent profile information
- Logout functionality

### 3. Available Jobs Tab
**Features**:
- Lists all pending orders with CPO/APO designation
- Real-time updates via Supabase subscriptions
- Job cards display:
  - Order number
  - Order type (🔵 Cash Purchase or 🟠 Assisted Purchase)
  - Store name and address
  - Item list (first 3 items + count)
  - Estimated amount
  - Distance (placeholder for geolocation)
  - Store notes
- **ACCEPT JOB** button
- Job locking mechanism (prevents double-assignment)

### 4. My Active Job Tab
**Features**:
- Complete order details
- Store information with contact and hours
- Customer delivery address
- Item breakdown with prices

#### Cash Purchase Order (CPO) Flow:

**Step 1: Request Cash**
- Agent requests company cash
- System checks against wallet limits
- Cash added to agent's wallet balance
- Transaction logged
- Order status → `cash_approved`

**Step 2: Purchase Confirmation**
- Enter actual amount spent
- Upload receipt photo
- Amount deducted from wallet
- Transaction logged
- Order status → `purchased`

**Step 3: On The Way**
- Single button to update status
- Order status → `on_the_way`

**Step 4: Delivery**
- Optional delivery photo upload
- Mark as delivered
- Order status → `delivered`
- Payment status → `paid`

#### Assisted Purchase Order (APO) Flow:

**Step 1: Purchase Confirmation**
- Select payment method (Company Cash or Company Card)
- Enter amount spent
- Upload receipt photo
- Order status → `purchased`
- No wallet deduction (different accounting)

**Step 2: On The Way** (same as CPO)

**Step 3: Delivery** (same as CPO)

### 5. Cash Wallet Tab
**Features**:
- Large balance display card
- Visual progress bar (current vs. limit)
- Wallet status indicator (Active/Frozen/Suspended)
- Transaction history (last 50)
- Transaction details:
  - Type (Cash Released, Purchase Made, etc.)
  - Amount (+ or -)
  - Balance before/after
  - Order reference
  - Timestamp
- Educational notice about how cash works

**Transaction Types**:
- 💰 Cash Released (green, positive)
- 🛒 Purchase Made (red, negative)
- ⚖️ Balance Adjustment (blue)
- 📊 Reconciliation (purple)

### 6. History Tab
**Features**:
- Stats cards:
  - Total deliveries
  - Total earnings (delivery fees)
  - Cancelled orders
- Filter by: All / Delivered / Cancelled
- Order cards showing:
  - Order number and date
  - Status badge
  - Purchase type (CPO/APO)
  - Store and delivery address
  - Items list
  - Purchase amount and delivery fee
  - Links to receipt and delivery photos

## Database Schema

### New Tables Created

#### `agent_wallets`
```sql
- id (UUID, primary key)
- agent_id (UUID, references users)
- company_cash_balance (DECIMAL, default 0.00)
- max_cash_limit (DECIMAL, default 500.00)
- status (TEXT: active, frozen, suspended)
- created_at, updated_at (TIMESTAMP)
```

#### `agent_transactions`
```sql
- id (UUID, primary key)
- agent_id (UUID, references users)
- order_id (UUID, references orders, nullable)
- transaction_type (TEXT: cash_released, purchase_made, balance_adjustment, reconciliation)
- amount (DECIMAL)
- balance_before (DECIMAL)
- balance_after (DECIMAL)
- description (TEXT)
- created_at (TIMESTAMP)
```

### Updated Tables

#### `orders`
New columns:
- `agent_id` - References agent assigned to order
- `purchase_type` - CPO or APO
- `estimated_amount` - Customer's estimate
- `actual_amount` - Agent's actual purchase amount
- `delivery_photo_url` - Photo proof of delivery
- `store_notes` - Special instructions
- `cash_released` - Amount released to agent

Updated enums:
- `order_type`: Added 'cash_purchase', 'assisted_purchase'
- `status`: Added 'assigned', 'cash_requested', 'cash_approved'
- `payment_method`: Added 'company_cash', 'company_card'

#### `users`
Updated role enum: Added 'agent'

### Storage Buckets

#### `receipts`
- Public read access
- Agents can upload
- Admins can delete
- Used for purchase receipts

#### `delivery-photos`
- Public read access
- Agents can upload
- Admins can delete
- Used for delivery proof

## File Structure

```
app/
  agent/
    layout.tsx                    # Auth guard and layout
    login/
      page.tsx                    # Agent login page
    page.tsx                      # Main agent home with tabs
    components/
      AvailableJobs.tsx          # Available jobs tab
      MyActiveJob.tsx            # Active job with CPO/APO flows
      CashWallet.tsx             # Wallet balance and transactions
      History.tsx                # Completed orders history

supabase/
  agent_features_migration.sql   # Database schema changes
  agent_storage_policies.sql     # Storage bucket policies

types/
  index.ts                        # Updated TypeScript types
```

## Types Added

```typescript
export type PurchaseType = 'CPO' | 'APO'
export type TransactionType = 'cash_released' | 'purchase_made' | 'balance_adjustment' | 'reconciliation'

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
  items?: OrderItem[]
  distance?: number
}
```

## Setup Instructions

### 1. Run Database Migrations

```sql
-- In Supabase SQL Editor:
-- 1. Run agent_features_migration.sql
-- 2. Run agent_storage_policies.sql
```

### 2. Create Test Agent Account

```sql
-- In Supabase SQL Editor:
INSERT INTO users (email, password_hash, full_name, phone_number, role, status)
VALUES (
  'agent@test.com',
  '$2a$10$...',  -- Use bcrypt hash or Supabase auth
  'Test Agent',
  '0721234567',
  'agent',
  'active'
);
```

Or use Supabase Dashboard:
1. Go to Authentication → Users
2. Create new user
3. Go to Database → users table
4. Update the user's role to 'agent'

### 3. Create Test Orders

For testing, create orders with:
- `purchase_type`: 'CPO' or 'APO'
- `status`: 'pending'
- `agent_id`: null (initially)
- `estimated_amount`: Any amount (e.g., 85.00)

### 4. Storage Buckets

In Supabase Dashboard → Storage:
1. Create bucket: `receipts` (public)
2. Create bucket: `delivery-photos` (public)
3. Run storage policies from `agent_storage_policies.sql`

## Usage Flow

### For Agents:

1. **Login** at `/agent/login`
2. **View Available Jobs** - See all pending CPO/APO orders
3. **Accept Job** - Click ACCEPT JOB to claim an order
4. **Navigate to My Active Job** tab

**For CPO Orders:**
5. Request cash (adds to wallet)
6. Purchase items and mark as purchased (deducts from wallet)
7. Mark as on the way
8. Mark as delivered

**For APO Orders:**
5. Select payment method
6. Purchase items and mark as purchased
7. Mark as on the way
8. Mark as delivered

9. **Check Cash Wallet** - View balance and transaction history
10. **View History** - See all completed deliveries and earnings

### For Admins:

- Set agent max_cash_limit in `agent_wallets` table
- Freeze/suspend wallets by updating status
- Monitor transactions in `agent_transactions` table
- View receipts and delivery photos
- Reconcile agent balances end-of-day

## Security Features

- Role-based authentication (agent role required)
- Account status check (must be active)
- Row-level security on agent_wallets and agent_transactions
- Job locking (prevents multiple agents accepting same job)
- Cash limit enforcement
- File upload restrictions (images only)
- Transaction logging for audit trail

## Real-time Updates

The system uses Supabase real-time subscriptions:
- Available Jobs list updates when orders change
- Active Job updates when status changes
- Prevents stale data issues

## Cash Management

### Prevents Theft & Chaos:

1. **Virtual Accounting** - All cash is tracked digitally
2. **Transaction Ledger** - Every transaction logged with before/after balances
3. **Limit Enforcement** - Agents can't request cash beyond their limit
4. **Wallet Freezing** - Admin can freeze agent wallets
5. **Receipt Requirements** - All purchases must have photo receipts
6. **Balance Reconciliation** - Admin can adjust balances and reconcile

### Cash Flow Example:

```
Initial Balance: R0.00

Order #1 (CPO):
  Cash Released: +R100.00
  Balance: R100.00
  
  Purchase: -R92.00
  Balance: R8.00

Order #2 (CPO):
  Cash Released: +R150.00
  Balance: R158.00
  
  Purchase: -R138.00
  Balance: R20.00

Order #3 (APO):
  No wallet impact (paid with company card)
  Balance: R20.00
```

## Future Enhancements

### Recommended Additions:

1. **Geolocation**:
   - Calculate actual distance to stores
   - Show on map
   - Optimize route planning

2. **Customer OTP**:
   - Generate delivery code
   - Customer confirms with OTP
   - Reduces delivery disputes

3. **Push Notifications**:
   - New job alerts
   - Status updates
   - Low cash warnings

4. **Performance Metrics**:
   - Delivery time tracking
   - Customer ratings
   - Efficiency scores

5. **Automated Cash Approval**:
   - Set rules for auto-approval
   - Reduce admin overhead
   - Faster job completion

6. **End-of-Day Reconciliation**:
   - Automated reconciliation workflow
   - Cash return process
   - Daily summary reports

7. **Multi-language Support**:
   - Support local languages
   - Better accessibility

8. **Offline Mode**:
   - Cache data locally
   - Sync when online
   - Better rural connectivity

## Troubleshooting

### Agent can't login:
- Check user role is 'agent' in database
- Check account status is 'active'
- Verify email/password are correct

### Cash request fails:
- Check wallet exists (should auto-create)
- Verify amount doesn't exceed max_cash_limit
- Check wallet status is 'active'

### Receipt upload fails:
- Verify storage bucket 'receipts' exists
- Check storage policies are applied
- Ensure file is an image type

### Jobs not appearing:
- Check orders have purchase_type (CPO or APO)
- Verify status is 'pending'
- Confirm agent_id is null

### Transaction not logged:
- Check agent_wallets table exists
- Verify agent_transactions has proper permissions
- Review Supabase logs for errors

## Support

For issues or questions:
1. Check Supabase logs in Dashboard
2. Review browser console for errors
3. Verify database schema is up to date
4. Check RLS policies are enabled
5. Contact system administrator

---

**Version**: 1.0  
**Last Updated**: December 18, 2025  
**Status**: Production Ready
