# Fix Realtime - Run This Now! 🚨

## The Problem
Realtime is enabled but **Row Level Security (RLS) policies** are blocking the subscription updates.

## The Fix

### Step 1: Run This SQL in Supabase

Go to **Supabase Dashboard → SQL Editor → New Query** and run:

```sql
-- Fix Realtime by ensuring proper RLS policies for SELECT on orders table

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their orders" ON orders;
DROP POLICY IF EXISTS "Agents can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Stores can view their orders" ON orders;

-- Create comprehensive SELECT policies that allow realtime subscriptions

-- Policy 1: Customers can view their own orders (required for customer realtime)
CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
USING (
  auth.uid() = customer_id
);

-- Policy 2: Agents can view orders assigned to them (required for agent realtime)
CREATE POLICY "Agents can view assigned orders"
ON orders FOR SELECT
USING (
  auth.uid() = agent_id OR
  (agent_id IS NULL AND status = 'pending')
);

-- Policy 3: Stores can view orders for their store (required for store realtime)
CREATE POLICY "Stores can view their orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.store_id = orders.store_id
  )
);

-- Policy 4: Allow agents to update assigned orders
CREATE POLICY "Agents can update assigned orders"
ON orders FOR UPDATE
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- Policy 5: Allow agents to accept pending orders
CREATE POLICY "Agents can accept pending orders"
ON orders FOR UPDATE
USING (
  status = 'pending' AND 
  agent_id IS NULL
)
WITH CHECK (
  auth.uid() = agent_id
);

-- Grant necessary permissions
GRANT SELECT ON orders TO authenticated;
GRANT UPDATE ON orders TO authenticated;
```

**Or** use the file: `supabase/fix_realtime_rls.sql`

### Step 2: Hard Refresh Browser
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Step 3: Test
1. Open 2 browser windows
2. Window 1: Customer → Orders page
3. Window 2: Agent → Accept a job
4. Window 1 should show toast notification **without refreshing**

## Why This Was the Issue

Supabase Realtime requires:
1. ✅ Realtime enabled on table (you had this)
2. ❌ **Proper RLS SELECT policies** (this was missing/wrong)

Without proper SELECT policies, the WebSocket connection succeeds but receives no data updates because RLS blocks them at the database level.

## Verify It's Working

After running the SQL, check browser console (F12):
- Should see: `"Order update received:"` when orders change
- Network tab → WS → Should see WebSocket messages flowing

**This will fix it. Run the SQL now!**
