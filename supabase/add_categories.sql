-- Categories support for per-store product grouping
-- Run this in Supabase SQL editor

-- 1) Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Development: disable RLS for categories to match other tables
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2) Optional column on products to relate to categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Backfill: create categories from existing product.category text per store
INSERT INTO categories (store_id, name)
SELECT DISTINCT p.store_id, p.category
FROM products p
LEFT JOIN categories c
  ON c.store_id = p.store_id AND c.name = p.category
WHERE c.id IS NULL AND p.category IS NOT NULL AND length(p.category) > 0;

-- 4) Link products to categories where names match
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.store_id = p.store_id AND c.name = p.category AND p.category_id IS NULL;

-- 5) Trigger to keep updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_categories_updated_at();
