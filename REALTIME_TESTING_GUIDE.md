# Real-Time Features Testing Guide 🧪

## Quick Start

Your app now has real-time updates! Before testing, you need to enable Realtime in Supabase.

## Step 1: Enable Realtime in Supabase ⚡

1. Go to https://supabase.com
2. Open your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Enable Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_transactions;
```

6. Click **Run** or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

**Alternative**: Open `supabase/enable_realtime.sql` and copy/paste from there.

## Step 2: Test Real-Time Updates 🎯

### Test 1: Customer Order Tracking

**Setup**: 2 browser windows
- **Window 1**: Regular browser (Customer)
- **Window 2**: Incognito/Private (Agent)

**Steps**:
1. **Window 1** - Customer:
   - Login as customer
   - Browse a store → Add items to cart
   - Go to checkout → Complete payment (use test Yoco card)
   - Navigate to "My Orders" page
   - **Keep this page open - DO NOT REFRESH**

2. **Window 2** - Agent:
   - Login as agent
   - Go online
   - You should see the new order in "Available Jobs"
   - Click "Accept Job"

3. **Watch Window 1** (Customer):
   - ✅ Should see toast: **"🎯 Agent assigned to your order!"**
   - ✅ Order card should update to show "Assigned" status
   - ✅ NO PAGE REFRESH NEEDED!

4. **Window 2** - Agent:
   - In Active Delivery, click "Items Purchased"

5. **Watch Window 1** (Customer):
   - ✅ Should see toast: **"🛍️ Items purchased!"**
   - ✅ Order status updates to "Purchased"

6. **Window 2** - Agent:
   - Click "On My Way"

7. **Watch Window 1** (Customer):
   - ✅ Should see toast: **"🚗 Order is on the way!"**

8. **Window 2** - Agent:
   - Upload photo → Click "Complete Delivery"

9. **Watch Window 1** (Customer):
   - ✅ Should see toast: **"✅ Order delivered!"**
   - ✅ Status changes to "Delivered"

**Expected Result**: Customer sees ALL updates instantly without refreshing!

---

### Test 2: Store New Orders

**Setup**: 2 browser windows
- **Window 1**: Regular browser (Store Owner)
- **Window 2**: Incognito/Private (Customer)

**Steps**:
1. **Window 1** - Store Owner:
   - Login as store owner
   - Navigate to "Orders" page
   - **Keep this page open**

2. **Window 2** - Customer:
   - Browse your store
   - Add items to cart
   - Complete checkout + payment

3. **Watch Window 1** (Store):
   - ✅ Should see toast: **"🛒 New order received!"**
   - ✅ Order appears in list automatically
   - ✅ Order count updates

4. **Window 2** - Customer payment completes

5. **Watch Window 1** (Store):
   - ✅ Should see toast: **"✅ Payment received!"**
   - ✅ Payment status updates on order card

**Expected Result**: Store sees new orders instantly when customers place them!

---

### Test 3: Agent Available Jobs

**Setup**: 2 browser windows
- **Window 1**: Regular browser (Agent)
- **Window 2**: Incognito/Private (Customer)

**Steps**:
1. **Window 1** - Agent:
   - Login as agent
   - Go online
   - Navigate to homepage (shows Available Jobs)
   - **Keep this page open**

2. **Window 2** - Customer:
   - Place a new order

3. **Watch Window 1** (Agent):
   - ✅ Should see toast: **"🆕 New delivery job available!"**
   - ✅ New job card appears in list
   - ✅ Job count updates: "Available Jobs (X)"

**Expected Result**: Agents see new jobs instantly!

---

## What Should You See? 🎬

### Toast Notifications
Toasts appear in the **top-right corner** with:
- Smooth slide-in animation from right
- Icon + message
- Color-coded by type:
  - 🟢 Green = Success (payments, delivery)
  - 🔵 Blue = Info (status updates)
  - 🟡 Yellow = Warning
  - 🔴 Red = Error
- Auto-dismiss after 3 seconds
- Can manually dismiss by clicking

### Real-Time Updates
- Order cards update immediately
- Status badges change color
- Timestamps update
- Counts refresh (e.g., "5 orders" → "6 orders")
- NO page refresh
- NO manual "Reload" button needed

---

## Troubleshooting 🔧

### Toasts Not Appearing?

1. **Check Browser Console**:
   - Press `F12` → Console tab
   - Look for errors related to Supabase or subscriptions
   - Should see: `✅ Subscribed to channel: xyz`

2. **Verify Realtime is Enabled**:
   - Supabase Dashboard → Database → Publications
   - Check `supabase_realtime` publication
   - Should list: orders, order_items, agent_wallets, agent_transactions

3. **Check Network Tab**:
   - F12 → Network tab → Filter by "WS" (WebSocket)
   - Should see active WebSocket connection to Supabase
   - Status: 101 Switching Protocols (means connected)

4. **Restart Dev Server**:
   ```powershell
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Updates Not Instant?

1. **Check Supabase Realtime Dashboard**:
   - Supabase → Settings → API
   - Scroll to "Realtime"
   - Should say "Enabled"

2. **Verify Database Migration**:
   - Run the `enable_realtime.sql` again
   - Check for any errors

3. **Hard Refresh**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - Clears cached JavaScript

### Multiple Toasts for Same Event?

This is normal if:
- Multiple components are mounted
- Multiple tabs open
- Each component has its own toast system

Can be fixed by:
- Using global toast context (future enhancement)
- Deduplicating toasts by ID

---

## Performance Notes 📊

### Network Usage
- Each WebSocket subscription: ~1KB/hour
- Very lightweight
- No polling = battery-friendly
- Auto-reconnects if connection drops

### Browser Compatibility
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (iOS 13+)
- ⚠️ IE11 not supported

### Mobile Testing
Real-time works on mobile too!
- Open app on your phone
- Place an order
- Leave Orders page open
- Update order from desktop
- Watch phone update instantly! 📱✨

---

## Advanced Testing

### Test Reconnection
1. Open browser DevTools (F12)
2. Network tab → Toggle "Offline" checkbox
3. Wait 5 seconds
4. Toggle "Online" again
5. ✅ Should auto-reconnect to Supabase
6. ✅ Updates resume working

### Test Multiple Agents
1. Open 3 windows: Customer, Agent 1, Agent 2
2. Customer places order
3. Both agents see toast notification
4. Agent 1 accepts job
5. Agent 2's list updates (job removed)
6. ✅ No conflicts!

### Load Testing
1. Create 10+ orders rapidly
2. All should update in real-time
3. No lag or dropped updates
4. Toasts should queue properly

---

## Success Checklist ✅

After testing, you should confirm:

- [ ] Customer sees agent assignment in real-time
- [ ] Customer sees status changes without refresh
- [ ] Store sees new orders instantly
- [ ] Store sees payment confirmations
- [ ] Agent sees new jobs appear
- [ ] Agent's active delivery updates live
- [ ] Toast notifications appear smoothly
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] No console errors in browser
- [ ] WebSocket connection shows in Network tab
- [ ] Updates work on mobile browsers
- [ ] Reconnects after going offline

---

## Next Steps 🚀

Once all tests pass:

1. **Celebrate!** 🎉 You have a professional real-time app!
2. **Deploy to Production** (see DEPLOYMENT.md)
3. **Monitor Supabase Realtime Dashboard** for active connections
4. **Test with real users** and gather feedback

---

## Need Help?

### Check Files:
- `lib/useRealtime.tsx` - Real-time hooks
- `supabase/enable_realtime.sql` - Database setup
- `REALTIME_IMPLEMENTATION.md` - Technical details

### Common Issues:
1. Forgot to run SQL migration → Run `enable_realtime.sql`
2. WebSocket blocked by firewall → Check network settings
3. Old cached code → Hard refresh browser
4. Not logged in → Toast system requires auth

---

**Remember**: Real-time only works after running the SQL migration! 

Good luck testing! 🚀
