-- Migration for Agent Features
-- This adds support for agent cash management and order tracking

-- 1. Add agent-specific columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS purchase_type TEXT CHECK (purchase_type IN ('CPO', 'APO')),
ADD COLUMN IF NOT EXISTS estimated_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
ADD COLUMN IF NOT EXISTS store_notes TEXT,
ADD COLUMN IF NOT EXISTS cash_released DECIMAL(10, 2);

-- Update order_status to include new states
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'assigned', 'cash_requested', 'cash_approved', 'received', 'purchased', 'on_the_way', 'delivered', 'cancelled'));

-- Update order_type to include new types
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN ('product_order', 'custom_request', 'cash_purchase', 'assisted_purchase'));

-- Update payment_method to include company options
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('yoco', 'cash', 'company_cash', 'company_card'));

-- 2. Create agent_wallets table
CREATE TABLE IF NOT EXISTS agent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_cash_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  max_cash_limit DECIMAL(10, 2) DEFAULT 500.00 NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- 3. Create agent_transactions table
CREATE TABLE IF NOT EXISTS agent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('cash_released', 'purchase_made', 'balance_adjustment', 'reconciliation')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_agent_id ON orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_purchase_type ON orders(purchase_type);
CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_wallets_status ON agent_wallets(status);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_order_id ON agent_transactions(order_id);

-- 5. Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for agent_wallets
DROP TRIGGER IF EXISTS update_agent_wallets_updated_at ON agent_wallets;
CREATE TRIGGER update_agent_wallets_updated_at
    BEFORE UPDATE ON agent_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Update user role constraint to include 'agent'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('customer', 'admin', 'driver', 'agent'));

-- 8. Add RLS policies for agent_wallets
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own wallet"
  ON agent_wallets FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all wallets"
  ON agent_wallets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can update wallets"
  ON agent_wallets FOR UPDATE
  USING (true);

CREATE POLICY "System can insert wallets"
  ON agent_wallets FOR INSERT
  WITH CHECK (true);

-- 9. Add RLS policies for agent_transactions
ALTER TABLE agent_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own transactions"
  ON agent_transactions FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all transactions"
  ON agent_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert transactions"
  ON agent_transactions FOR INSERT
  WITH CHECK (true);

-- 10. Create function to automatically create wallet for new agents
CREATE OR REPLACE FUNCTION create_agent_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    INSERT INTO agent_wallets (agent_id, company_cash_balance, max_cash_limit, status)
    VALUES (NEW.id, 0.00, 500.00, 'active')
    ON CONFLICT (agent_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_agent_wallet ON users;
CREATE TRIGGER auto_create_agent_wallet
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_agent_wallet();

-- 11. Sample data: Create a test agent (optional - comment out if not needed)
-- INSERT INTO users (email, password_hash, full_name, phone_number, role, status)
-- VALUES (
--   'agent1@tsakasi.com',
--   '$2a$10$example', -- Replace with actual hash
--   'John Agent',
--   '0721234567',
--   'agent',
--   'active'
-- );
