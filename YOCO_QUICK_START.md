# Quick Setup Guide - Yoco Integration

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor, run:
c:\Users\Thend\Tsa Kasi Delieveries\supabase\add_banking_details.sql
```

### Step 2: Set Environment Variables
```env
# Add to .env.local (for testing)
YOCO_SECRET_KEY=sk_test_your_test_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Test the Integration
```bash
# 1. Start dev server
npm run dev

# 2. As customer:
- Add items to cart
- Go to checkout
- Place order
- Should redirect to Yoco payment

# 3. As store owner:
- Login to store portal
- Complete profile wizard (will appear automatically)
- Go to Orders → Click "✓ Paid" filter
```

---

## 📋 Features Checklist

### ✅ Yoco Payment Integration
- [x] Payment creation API (`/api/yoco/create-payment`)
- [x] Payment webhook handler (`/api/yoco/webhook`)
- [x] Checkout page integration
- [x] Order payment status tracking

### ✅ Store Banking Details
- [x] Database schema with banking fields
- [x] Banking details form in settings
- [x] Verification status tracking
- [x] Support for all major SA banks

### ✅ Store Profile Wizard
- [x] 3-step guided setup
- [x] Auto-appears for incomplete profiles
- [x] Collects basic info + banking details
- [x] Review & confirm step

### ✅ Paid Orders Filter
- [x] "Paid" filter option
- [x] "Unpaid" filter option
- [x] Order count badges
- [x] Payment status indicators

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `app/api/yoco/create-payment/route.ts` | Creates Yoco payment checkout |
| `app/api/yoco/webhook/route.ts` | Handles payment confirmations |
| `app/customer/checkout/page.tsx` | Initiates payment flow |
| `app/store/settings/page.tsx` | Banking details form |
| `app/store/components/StoreProfileWizard.tsx` | Profile setup wizard |
| `app/store/orders/page.tsx` | Orders with paid filter |
| `supabase/add_banking_details.sql` | Database migration |
| `YOCO_INTEGRATION_GUIDE.md` | Full documentation |

---

## 🧪 Testing Commands

### Test Payment Flow
```typescript
// 1. Customer adds items to cart
// 2. Goes to checkout
// 3. Fills delivery details
// 4. Clicks "Place Order"
// 5. Redirects to Yoco payment page
// 6. Completes payment with test card: 4242 4242 4242 4242
// 7. Redirects back to orders page
// 8. Order should show as "Paid"
```

### Test Store Wizard
```sql
-- Reset store profile to trigger wizard
UPDATE stores 
SET description = NULL, phone_number = NULL, bank_name = NULL 
WHERE id = 'your-store-id';
```

### Test Paid Filter
```sql
-- Create test orders with different statuses
UPDATE orders SET payment_status = 'paid' WHERE id = 'order-1';
UPDATE orders SET payment_status = 'pending' WHERE id = 'order-2';
```

---

## 🔧 Production Setup

### 1. Get Yoco Live Keys
- Go to [Yoco Dashboard](https://portal.yoco.com/)
- Switch to "Live" mode
- Copy API keys

### 2. Configure Webhook
**Webhook URL:** `https://your-domain.com/api/yoco/webhook`

**Events to enable:**
- `payment.succeeded`
- `checkout.succeeded`
- `payment.failed`
- `checkout.failed`

### 3. Update Environment Variables
```env
YOCO_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 💡 Pro Tips

1. **Test with small amounts first** (R1-R10)
2. **Check Yoco webhook logs** in their dashboard
3. **Monitor order payment_status** in Supabase
4. **Banking details verification** - manually verify before enabling payouts
5. **Use Yoco test mode extensively** before going live

---

## 📞 Support

- **Yoco Support:** support@yoco.com
- **Yoco Docs:** https://developer.yoco.com/
- **Full Guide:** See `YOCO_INTEGRATION_GUIDE.md`

---

## ✨ What's Next?

Consider adding:
- [ ] SMS notifications on payment success
- [ ] Email receipts to customers
- [ ] Admin dashboard for payment reconciliation
- [ ] Refund functionality
- [ ] Payment history export

---

**Last Updated:** January 12, 2026
**Status:** ✅ Production Ready
