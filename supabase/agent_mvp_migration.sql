-- Migration: Simplified Agent MVP
-- Adds is_online column for agent status tracking

-- Add is_online column to agent_profiles if it doesn't exist
ALTER TABLE agent_profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Create index for faster online agent lookups
CREATE INDEX IF NOT EXISTS idx_agent_profiles_is_online ON agent_profiles(is_online) WHERE is_online = true;

-- Update any null values to false
UPDATE agent_profiles SET is_online = false WHERE is_online IS NULL;
