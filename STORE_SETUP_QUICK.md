# Store UI - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration
Execute the SQL migration in your Supabase dashboard:

**File:** `supabase/store_access_codes.sql`

This migration will:
- ✅ Add `access_code` column to stores table
- ✅ Generate unique 8-character codes for all existing stores
- ✅ Set up automatic code generation for new stores

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `store_access_codes.sql`
4. Click "Run"

### Step 2: Get Store Access Codes
1. Go to **Admin → Stores** page in your app
2. Each store now displays a blue card with its access code
3. Click the **Copy** button to copy the code
4. Share the code securely with the store manager

### Step 3: Store Manager Login
Store managers can now access their portal:

1. Navigate to: **`/store/login`**
2. Enter the 8-character access code
3. Click "Login"
4. Access the full store management dashboard!

## 📱 Store Manager Features

Once logged in, store managers can:

### 📊 Dashboard
- View new orders in real-time
- Track orders in progress
- See today's sales and completed orders
- Get alerts for pending orders

### 📦 Orders Management
- Accept/confirm new orders
- Update order status (preparing → ready for pickup)
- View customer details and special instructions
- See assigned delivery agents

### 🍔 Menu Management
- Add/edit/delete products
- Set prices and descriptions
- Manage stock availability
- Organize by categories

### 📜 Order History
- View completed orders
- Filter by date range (today, week, month, all time)
- Export to CSV for accounting
- Track sales analytics

### ⚙️ Settings
- Update store information
- View and copy access code
- Manage contact details
- Update business information

## 🔐 Security Notes

- **Access codes are unique** - Each store has its own code
- **Keep codes secure** - Only share with authorized staff
- **No signup needed** - Admin creates stores, managers just login
- **Session-based** - Stored locally in browser
- **Easy to reset** - Admin can regenerate codes if compromised

## 📝 Important Files Created

### Frontend Pages
- `app/store/login/page.tsx` - Login with access code
- `app/store/layout.tsx` - Navigation and layout
- `app/store/dashboard/page.tsx` - Main dashboard
- `app/store/orders/page.tsx` - Order management
- `app/store/menu/page.tsx` - Product management
- `app/store/history/page.tsx` - Order history
- `app/store/settings/page.tsx` - Store settings

### Database
- `supabase/store_access_codes.sql` - Migration file

### Documentation
- `STORE_UI_GUIDE.md` - Complete documentation

### Updates
- `types/index.ts` - Added access_code to Store type
- `app/admin/stores/page.tsx` - Display access codes with copy button

## ✅ Verification Checklist

After setup, verify:

- [ ] Database migration ran successfully
- [ ] Existing stores have access codes
- [ ] Access codes are visible in Admin → Stores
- [ ] Copy button works for access codes
- [ ] Store login page loads at `/store/login`
- [ ] Can login with an access code
- [ ] Dashboard displays correctly
- [ ] Orders page shows store-specific orders
- [ ] Menu management works (add/edit/delete products)
- [ ] Settings page shows store info
- [ ] Real-time order updates work

## 🆘 Troubleshooting

**Migration fails?**
- Check if `access_code` column already exists
- Ensure you have proper database permissions

**Access code not showing?**
- Refresh the admin stores page
- Check the database to confirm column exists
- Verify the store has an access_code value

**Can't login with access code?**
- Ensure the code is exactly 8 characters
- Check it matches the code in the database
- Try uppercase (codes are case-insensitive in the UI)

**Real-time updates not working?**
- Check Supabase project is active
- Verify real-time is enabled in Supabase dashboard
- Check browser console for connection errors

## 🎯 Next Steps

1. **Run the migration** - Most important step!
2. **Test login** - Try logging in with a store's access code
3. **Share with stores** - Distribute access codes to store managers
4. **Monitor usage** - Watch the orders flow through the system

## 📚 Full Documentation

For complete details, see: **`STORE_UI_GUIDE.md`**
