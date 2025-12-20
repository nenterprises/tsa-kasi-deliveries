-- Quick fix for RLS signup issue
-- Run this in Supabase SQL Editor

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON users;

-- Create a new policy that allows ANY authenticated user to insert their own profile
CREATE POLICY "Authenticated users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
