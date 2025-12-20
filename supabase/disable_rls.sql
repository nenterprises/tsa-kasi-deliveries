-- Disable Row Level Security for core tables and drop policies (development convenience)
-- Run this in Supabase SQL editor in your project

-- Users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can create own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Stores
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;

-- Products
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Order Items
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view order items for accessible orders" ON order_items;
DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

-- Note: Storage (storage.objects) uses policies; RLS can't be disabled there.
-- Ensure storage policies allow public READ and authenticated WRITE:
-- See storage_policies.sql for recommended defaults.
