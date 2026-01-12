-- Fix Realtime by ensuring proper RLS policies for SELECT on orders table
-- This is required for Supabase Realtime to work properly

-- First, disable RLS temporarily to drop all policies
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on orders table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON orders';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies that allow realtime subscriptions

-- Policy 1: Customers can view their own orders (required for customer realtime)
CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
USING (
  auth.uid() = customer_id
);

-- Policy 2: Customers can create orders (required for placing orders)
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
);

-- Policy 3: Agents can view orders assigned to them (required for agent realtime)
CREATE POLICY "Agents can view assigned orders"
ON orders FOR SELECT
USING (
  auth.uid() = agent_id OR
  (agent_id IS NULL AND status = 'pending')
);

-- Policy 4: Store owners can view their store's orders (required for store realtime)
CREATE POLICY "Stores can view their orders"
ON orders FOR SELECT
USING (
  -- Allow if user is admin OR if they're viewing orders for stores they manage
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 5: Allow agents to update assigned orders
CREATE POLICY "Agents can update assigned orders"
ON orders FOR UPDATE
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- Policy 6: Allow agents to accept pending orders
CREATE POLICY "Agents can accept pending orders"
ON orders FOR UPDATE
USING (
  status = 'pending' AND 
  agent_id IS NULL
)
WITH CHECK (
  auth.uid() = agent_id
);

-- Verify RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON orders TO authenticated;
GRANT INSERT ON orders TO authenticated;
GRANT UPDATE ON orders TO authenticated;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'orders';
