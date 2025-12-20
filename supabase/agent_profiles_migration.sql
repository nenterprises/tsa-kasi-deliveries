-- Migration for Agent Profiles
-- This adds profile information for agents

-- 1. Create agent_profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_number TEXT,
  profile_photo_url TEXT,
  home_area TEXT,
  township TEXT,
  agent_status TEXT DEFAULT 'active' CHECK (agent_status IN ('active', 'temporarily_suspended', 'blacklisted')),
  orders_completed INTEGER DEFAULT 0,
  orders_cancelled INTEGER DEFAULT 0,
  receipt_issues INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agent_id ON agent_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agent_status ON agent_profiles(agent_status);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_township ON agent_profiles(township);

-- 3. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_agent_profiles_updated_at ON agent_profiles;
CREATE TRIGGER update_agent_profiles_updated_at
    BEFORE UPDATE ON agent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Auto-create agent profile when agent wallet is created
CREATE OR REPLACE FUNCTION public.create_agent_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_profiles (agent_id)
  VALUES (NEW.agent_id)
  ON CONFLICT (agent_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agent_wallet_created ON agent_wallets;
CREATE TRIGGER on_agent_wallet_created
AFTER INSERT ON agent_wallets
FOR EACH ROW EXECUTE FUNCTION public.create_agent_profile();

-- 5. Function to update agent stats after order completion
CREATE OR REPLACE FUNCTION public.update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_active_at on any order change
  UPDATE agent_profiles 
  SET last_active_at = NOW()
  WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id);
  
  -- Increment completed orders
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE agent_profiles 
    SET orders_completed = orders_completed + 1
    WHERE agent_id = NEW.agent_id;
  END IF;
  
  -- Increment cancelled orders (agent was assigned but order cancelled)
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('pending', 'cancelled') AND OLD.agent_id IS NOT NULL THEN
    UPDATE agent_profiles 
    SET orders_cancelled = orders_cancelled + 1
    WHERE agent_id = OLD.agent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.agent_id IS DISTINCT FROM NEW.agent_id)
EXECUTE FUNCTION public.update_agent_stats();

-- 6. RLS policies for agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Agents can view their own profile
CREATE POLICY "Agents can view their own profile"
  ON agent_profiles FOR SELECT
  USING (auth.uid() = agent_id);

-- Agents can update their own profile (limited fields)
CREATE POLICY "Agents can update their own profile"
  ON agent_profiles FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all agent profiles"
  ON agent_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can update all profiles
CREATE POLICY "Admins can update all agent profiles"
  ON agent_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can insert profiles
CREATE POLICY "Admins can insert agent profiles"
  ON agent_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- System can insert profiles (for auto-creation)
CREATE POLICY "System can insert agent profiles"
  ON agent_profiles FOR INSERT
  WITH CHECK (true);

-- 7. Create existing agent profiles for agents that already have wallets
INSERT INTO agent_profiles (agent_id)
SELECT agent_id FROM agent_wallets
ON CONFLICT (agent_id) DO NOTHING;

-- 8. Development: Disable RLS for easier development (remove in production)
ALTER TABLE agent_profiles DISABLE ROW LEVEL SECURITY;
