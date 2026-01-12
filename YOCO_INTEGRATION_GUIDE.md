# Yoco Payment Integration & Store Features - Complete Guide

## 🎯 Overview

This guide covers the complete Yoco payment integration, payment webhooks, store banking details collection, and the store profile wizard.

---

## 💳 Yoco Payment Integration

### Features Implemented

1. **Payment Creation API** (`/api/yoco/create-payment`)
   - Creates Yoco checkout sessions
   - Supports order metadata (customer ID, order IDs)
   - Redirects to Yoco payment page
   - Returns success/failure URLs

2. **Payment Webhook** (`/api/yoco/webhook`)
   - Receives payment confirmation from Yoco
   - Updates order payment status automatically
   - Handles payment success and failure events
   - Supports multiple orders in one payment

3. **Checkout Integration** (`/customer/checkout`)
   - Integrated Yoco payment flow
   - Creates orders first, then initiates payment
   - Redirects to Yoco for secure payment
   - Returns to orders page after payment

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For webhook
YOCO_SECRET_KEY=sk_test_xxx  # Your Yoco secret key
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For redirect URLs
```

### Payment Flow

```
1. Customer adds items to cart
2. Customer goes to checkout
3. Customer fills delivery details
4. System creates orders in database (payment_status: 'pending')
5. System calls Yoco API to create payment checkout
6. Customer redirected to Yoco payment page
7. Customer completes payment
8. Yoco sends webhook to /api/yoco/webhook
9. Webhook updates order payment_status to 'paid'
10. Customer redirected back to orders page
```

### API Route: Create Payment

**Location:** `app/api/yoco/create-payment/route.ts`

**Request:**
```typescript
POST /api/yoco/create-payment
{
  amount: number,        // Total amount in Rands (e.g., 150.50)
  currency: "ZAR",       // Currency code
  metadata: {
    orderIds: string[],  // Array of order IDs
    customerId: string,
    customerEmail: string
  }
}
```

**Response:**
```typescript
{
  checkoutId: string,    // Yoco checkout ID
  redirectUrl: string    // URL to redirect customer to
}
```

### API Route: Payment Webhook

**Location:** `app/api/yoco/webhook/route.ts`

**Webhook Events Handled:**
- `payment.succeeded` / `checkout.succeeded` → Updates orders to `paid`
- `payment.failed` / `checkout.failed` → Updates orders to `failed`

**Webhook URL to Configure in Yoco:**
```
https://your-domain.com/api/yoco/webhook
```

---

## 🏪 Store Banking Details

### Database Schema

**Location:** `supabase/add_banking_details.sql`

**Fields Added to `stores` Table:**
- `bank_name` (TEXT) - Name of the bank
- `account_holder_name` (TEXT) - Account holder's name
- `account_number` (TEXT) - Bank account number
- `account_type` (TEXT) - 'savings', 'current', or 'cheque'
- `branch_code` (TEXT) - Bank branch code
- `banking_details_verified` (BOOLEAN) - Admin verification flag
- `banking_details_updated_at` (TIMESTAMP) - Last update timestamp

### Running the Migration

```bash
# In Supabase SQL Editor, run:
supabase/add_banking_details.sql
```

Or via Supabase CLI:
```bash
supabase db reset
# Or apply specific migration
```

### Store Settings Page

**Location:** `app/store/settings/page.tsx`

**Features:**
- Store information form (name, description, phone, etc.)
- Banking details form
- Access code display with copy functionality
- Verification status indicator
- Store statistics

**Banking Details Form Fields:**
1. Bank Name (dropdown with SA banks)
2. Account Holder Name
3. Account Number (numeric only, max 16 digits)
4. Account Type (savings/current/cheque)
5. Branch Code (numeric only, max 6 digits)

**Supported Banks:**
- ABSA
- African Bank
- Capitec (Branch code: 470010)
- Discovery Bank
- FNB (First National Bank)
- Investec
- Nedbank
- Standard Bank
- TymeBank

---

## 🧙‍♂️ Store Profile Wizard

### Component

**Location:** `app/store/components/StoreProfileWizard.tsx`

**Purpose:** Guide new stores through completing their profile on first login

### Features

**3-Step Wizard:**

#### Step 1: Basic Information
- Store description (required)
- Contact phone number (required)
- Operating days (default: Mon-Sun)
- Opening time (default: 08:00)
- Closing time (default: 18:00)

#### Step 2: Banking Details
- Bank name (required)
- Account holder name (required)
- Account number (required)
- Account type (required)
- Branch code (optional)

#### Step 3: Review & Confirm
- Summary of all entered information
- Final confirmation before saving

### Integration

**Location:** `app/store/dashboard/page.tsx`

The wizard automatically shows when:
- Store is missing `description` OR
- Store is missing `phone_number` OR
- Store is missing `bank_name` OR
- Store is missing `account_number`

**User Flow:**
1. Store owner logs in for the first time
2. Dashboard checks if profile is complete
3. If incomplete, wizard modal appears
4. Owner completes 3-step wizard
5. Data is saved to database
6. Wizard closes, dashboard loads normally

---

## 📊 Store Paid Orders Filter

### Location

`app/store/orders/page.tsx`

### Features

**New Filter Options:**
- All Orders
- New (pending)
- Accepted (received)
- Purchased
- In Transit (on_the_way)
- ✓ Paid (payment_status = 'paid')
- 💰 Unpaid (payment_status != 'paid')

### Implementation

```typescript
const filteredOrders = filter === 'all' 
  ? orders 
  : filter === 'paid'
    ? orders.filter(order => order.payment_status === 'paid')
    : filter === 'unpaid'
      ? orders.filter(order => order.payment_status !== 'paid')
      : orders.filter(order => order.status === filter)
```

### UI Features

- Filter tabs with order counts
- Payment status badge on each order card
- Visual indicators (✓ for paid, 💰 for unpaid)
- Real-time updates via Supabase subscriptions

---

## 🧪 Testing Guide

### 1. Test Yoco Payment Integration

**Using Yoco Test Mode:**

```bash
# Set test keys in .env.local
YOCO_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_YOCO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

**Test Flow:**
1. Add items to cart as customer
2. Go to checkout
3. Fill delivery details
4. Click "Place Order"
5. Should redirect to Yoco test payment page
6. Use Yoco test card: `4242 4242 4242 4242`
7. Complete payment
8. Should redirect back to orders page
9. Check order payment_status is 'paid'

### 2. Test Banking Details Form

1. Log in as store owner
2. Go to Settings
3. Scroll to "Banking Details" section
4. Fill in all required fields
5. Click "Save Banking Details"
6. Verify data is saved (refresh page)

### 3. Test Store Profile Wizard

**Simulate First-Time Login:**

```sql
-- Run in Supabase SQL Editor to reset store profile
UPDATE stores 
SET 
  description = NULL,
  phone_number = NULL,
  bank_name = NULL,
  account_number = NULL
WHERE id = 'your-store-id';
```

**Then:**
1. Log in to store portal
2. Wizard should appear automatically
3. Complete all 3 steps
4. Verify data is saved
5. Wizard should not appear again

### 4. Test Paid Orders Filter

1. Log in as store owner
2. Go to Orders page
3. Create test orders with different payment statuses:
   ```sql
   -- Paid order
   UPDATE orders SET payment_status = 'paid' WHERE id = 'order-id-1';
   
   -- Unpaid order
   UPDATE orders SET payment_status = 'pending' WHERE id = 'order-id-2';
   ```
4. Click "✓ Paid" filter → should show only paid orders
5. Click "💰 Unpaid" filter → should show pending/failed orders
6. Verify order counts in filter badges

---

## 🔒 Security Considerations

### Webhook Security

The webhook endpoint should verify requests are from Yoco:

```typescript
// TODO: Implement Yoco signature verification
const signature = request.headers.get('x-yoco-signature')
// Verify signature using Yoco's method
```

### Banking Details

- Banking details are stored in database
- Only store owners can view their own banking details
- Admin verification flag prevents unauthorized changes
- Never display full account numbers in UI (mask them)

### Payment Processing

- Never store credit card details
- All payments processed through Yoco
- Use HTTPS in production
- Validate all amounts server-side

---

## 📱 Production Deployment Checklist

### Environment Variables

```env
# Production
YOCO_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_YOCO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Yoco Configuration

1. Log in to Yoco dashboard
2. Switch to Live mode
3. Get Live API keys
4. Configure webhook URL: `https://your-domain.com/api/yoco/webhook`
5. Enable events: `payment.succeeded`, `payment.failed`

### Database Migration

```bash
# Run in Supabase production project
1. Go to SQL Editor
2. Run: supabase/add_banking_details.sql
3. Verify columns added to stores table
```

### Testing in Production

1. Test with small real payment first
2. Verify webhook receives events
3. Check order status updates correctly
4. Test store profile wizard flow
5. Verify banking details save correctly

---

## 🐛 Troubleshooting

### Payment Not Updating After Yoco

**Check:**
1. Webhook URL is correct in Yoco dashboard
2. Webhook endpoint is publicly accessible
3. Check server logs for webhook errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
5. Check order IDs in metadata match database

### Store Profile Wizard Not Appearing

**Check:**
1. Store has incomplete profile (missing fields)
2. Component is imported correctly
3. No JavaScript console errors
4. Database has nullable fields for banking details

### Banking Details Not Saving

**Check:**
1. Migration script has been run
2. Column names match exactly
3. Account type values are valid ('savings', 'current', 'cheque')
4. No database constraints violated

---

## 📚 Additional Resources

- [Yoco API Documentation](https://developer.yoco.com/)
- [Yoco Webhooks Guide](https://developer.yoco.com/webhooks)
- [Supabase Database Functions](https://supabase.com/docs/guides/database)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎉 Summary

**Completed Features:**
✅ Yoco payment integration
✅ Payment confirmation webhook
✅ Store "paid orders" filter
✅ Store profile wizard
✅ Banking details collection
✅ Banking details form

**Files Created/Modified:**
- `app/api/yoco/create-payment/route.ts` - Payment creation endpoint
- `app/api/yoco/webhook/route.ts` - Payment webhook handler
- `app/customer/checkout/page.tsx` - Integrated Yoco payment
- `app/store/orders/page.tsx` - Added paid/unpaid filters
- `app/store/settings/page.tsx` - Added banking details form
- `app/store/dashboard/page.tsx` - Integrated profile wizard
- `app/store/components/StoreProfileWizard.tsx` - 3-step wizard component
- `supabase/add_banking_details.sql` - Database migration
- `types/index.ts` - Updated Store interface

**Next Steps:**
1. Run database migration
2. Set up Yoco API keys
3. Configure webhook URL in Yoco dashboard
4. Test payment flow end-to-end
5. Test store profile wizard
6. Deploy to production
