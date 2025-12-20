# Agent UI - Quick Setup Guide

## 🚀 Getting Started

### Step 1: Database Setup

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run these migrations in order:

#### Migration 1: Agent Features
```bash
# Copy and run the contents of:
supabase/agent_features_migration.sql
```

#### Migration 2: Storage Policies
```bash
# Copy and run the contents of:
supabase/agent_storage_policies.sql
```

### Step 2: Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create 'receipts' bucket**:
   - Name: `receipts`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: image/*

2. **Create 'delivery-photos' bucket**:
   - Name: `delivery-photos`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: image/*

### Step 3: Create Test Agent Account

**Option A: Using Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add user"
3. Email: `agent@test.com`
4. Password: `TestAgent123!` (or your choice)
5. After creating, go to Database → Tables → users
6. Find the user and update:
   - `role`: Change to `agent`
   - `full_name`: Add a name
   - `status`: Set to `active`

**Option B: Using SQL**
```sql
-- First create the auth user in Supabase Auth UI, then:
UPDATE users 
SET role = 'agent', 
    full_name = 'Test Agent',
    status = 'active'
WHERE email = 'agent@test.com';
```

### Step 4: Create Test Orders

Run this SQL to create sample CPO and APO orders:

```sql
-- First, get a store_id from your stores table
-- Then create test orders:

-- Cash Purchase Order (CPO)
INSERT INTO orders (
  customer_id, 
  store_id, 
  order_type, 
  purchase_type,
  estimated_amount,
  total_amount,
  delivery_fee,
  delivery_address,
  delivery_township,
  status,
  payment_status
)
VALUES (
  (SELECT id FROM users WHERE role = 'customer' LIMIT 1),
  (SELECT id FROM stores LIMIT 1),
  'cash_purchase',
  'CPO',
  85.00,
  85.00,
  15.00,
  '123 Test Street, Modimolle',
  'modimolle',
  'pending',
  'pending'
);

-- Assisted Purchase Order (APO)
INSERT INTO orders (
  customer_id,
  store_id,
  order_type,
  purchase_type,
  estimated_amount,
  total_amount,
  delivery_fee,
  delivery_address,
  delivery_township,
  status,
  payment_status,
  custom_request_text
)
VALUES (
  (SELECT id FROM users WHERE role = 'customer' LIMIT 1),
  (SELECT id FROM stores LIMIT 1),
  'assisted_purchase',
  'APO',
  40.00,
  40.00,
  10.00,
  '456 Test Avenue, Phagameng',
  'phagameng',
  'pending',
  'pending',
  '2x Kota from street vendor'
);
```

### Step 5: Test the Application

1. **Build the project**:
```powershell
npm run build
```

2. **Start development server**:
```powershell
npm run dev
```

3. **Navigate to Agent Portal**:
```
http://localhost:3000/agent/login
```

4. **Login with test credentials**:
- Email: `agent@test.com`
- Password: (whatever you set)

## ✅ Testing Checklist

### Available Jobs Tab
- [ ] Can see pending CPO/APO orders
- [ ] CPO orders show blue badge 🔵
- [ ] APO orders show orange badge 🟠
- [ ] Can click "ACCEPT JOB"
- [ ] Job disappears from list after acceptance

### My Active Job Tab (CPO Flow)
- [ ] See accepted CPO order details
- [ ] Can request cash (Step 1)
- [ ] Wallet balance increases
- [ ] Can enter amount spent (Step 2)
- [ ] Can upload receipt photo
- [ ] Can mark as purchased
- [ ] Wallet balance decreases
- [ ] Can mark "On The Way"
- [ ] Can upload delivery photo (optional)
- [ ] Can mark as delivered

### My Active Job Tab (APO Flow)
- [ ] See accepted APO order details
- [ ] Can select payment method (Company Cash/Card)
- [ ] Can enter amount spent
- [ ] Can upload receipt
- [ ] Can mark as purchased (no wallet impact)
- [ ] Can mark "On The Way"
- [ ] Can mark as delivered

### Cash Wallet Tab
- [ ] See current balance
- [ ] See max cash limit
- [ ] See wallet status (Active)
- [ ] See transaction history
- [ ] Transactions show correct amounts
- [ ] Transactions show order references

### History Tab
- [ ] See delivered orders
- [ ] See statistics (deliveries, earnings)
- [ ] Can filter (All/Delivered/Cancelled)
- [ ] Can view receipts
- [ ] Can view delivery photos

## 🔧 Troubleshooting

### "Cannot find module" errors in IDE
- Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Or restart VS Code

### Agent wallet not created
```sql
-- Manually create wallet:
INSERT INTO agent_wallets (agent_id, company_cash_balance, max_cash_limit, status)
VALUES (
  (SELECT id FROM users WHERE email = 'agent@test.com'),
  0.00,
  500.00,
  'active'
);
```

### Storage upload fails
- Verify buckets exist in Supabase Storage
- Check bucket policies are applied
- Ensure buckets are set to "public"

### Orders not appearing
```sql
-- Check orders:
SELECT id, order_type, purchase_type, status, agent_id 
FROM orders 
WHERE status = 'pending';

-- Update order to pending if needed:
UPDATE orders 
SET status = 'pending', agent_id = NULL
WHERE id = 'your-order-id';
```

### RLS preventing access
```sql
-- Temporarily disable RLS for testing (NOT for production):
ALTER TABLE agent_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_transactions DISABLE ROW LEVEL SECURITY;

-- Re-enable when done:
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_transactions ENABLE ROW LEVEL SECURITY;
```

## 📱 Testing on Mobile

For realistic testing:
1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `.env.local` if needed
3. Access from phone: `http://YOUR_IP:3000/agent/login`
4. Test photo uploads
5. Test in different network conditions

## 🎯 Demo Scenarios

### Scenario 1: Cash Purchase Order
1. Login as agent
2. Go to Available Jobs
3. Accept a CPO order
4. Go to My Active Job
5. Request R100 cash
6. Check Cash Wallet (should show R100)
7. Enter actual amount: R92
8. Upload a test receipt image
9. Mark as purchased
10. Check Cash Wallet (should show R8)
11. Mark as on the way
12. Mark as delivered
13. Check History tab

### Scenario 2: Assisted Purchase Order
1. Accept an APO order
2. Select "Company Card" payment
3. Enter amount spent: R42
4. Upload receipt
5. Mark as purchased (no wallet change)
6. Complete delivery
7. Check History

### Scenario 3: Multiple Orders
1. Accept multiple orders to test workflow
2. Check wallet balance accumulates correctly
3. Verify transaction history accuracy
4. Test filters in History tab

## 🚨 Important Notes

- **Production**: Always use strong passwords
- **Security**: Enable RLS in production
- **Backups**: Backup database before migrations
- **Testing**: Test thoroughly before going live
- **Monitoring**: Set up error tracking (e.g., Sentry)

## 📊 Admin Features (To Add Later)

For now, admins can manage via Supabase Dashboard:
- View all agent wallets
- Adjust max_cash_limit
- Freeze/unfreeze wallets
- View all transactions
- Download reports

Future: Build admin panel for these features.

## 🎉 You're Ready!

The Agent UI is now fully functional with:
- ✅ Authentication
- ✅ Job management
- ✅ CPO workflow with cash management
- ✅ APO workflow
- ✅ Cash wallet tracking
- ✅ Transaction history
- ✅ Order history

Need help? Check [AGENT_UI_GUIDE.md](./AGENT_UI_GUIDE.md) for full documentation.
