-- Fix Realtime by ensuring proper RLS policies for SELECT on orders table
-- This is required for Supabase Realtime to work properly

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

-- Policy 4: Allow authenticated users to update orders (for agents accepting jobs)
CREATE POLICY "Agents can update assigned orders"
ON orders FOR UPDATE
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- Policy 5: Allow agents to accept pending orders
CREATE POLICY "Agents can accept pending orders"
ON orders FOR UPDATE
USING (
  status = 'pending' AND 
  agent_id IS NULL AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = agent_id
);

-- Verify RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON orders TO authenticated;
GRANT UPDATE ON orders TO authenticated;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'orders';
