-- Checkers Modimolle Menu Seed
-- Grocery store essentials

DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores WHERE name ILIKE '%Checkers%Modimolle%';
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store not found! Create "Checkers Modimolle" first in Admin panel.';
  END IF;

  INSERT INTO products (store_id, name, price, category, description, available) VALUES
  -- BAKERY
  (v_store_id, 'White Bread 700g', 14.99, 'Bakery', 'Fresh white bread', true),
  (v_store_id, 'Brown Bread 700g', 15.99, 'Bakery', 'Fresh brown bread', true),
  (v_store_id, 'Hot Dog Rolls 6s', 12.99, 'Bakery', 'Soft hot dog rolls', true),
  
  -- DAIRY
  (v_store_id, 'Fresh Milk 2L', 24.99, 'Dairy', 'Full cream fresh milk', true),
  (v_store_id, 'Low Fat Milk 2L', 24.99, 'Dairy', 'Low fat milk', true),
  (v_store_id, 'Large Eggs 18s', 45.99, 'Dairy', 'Large fresh eggs', true),
  (v_store_id, 'Medium Eggs 30s', 65.99, 'Dairy', 'Medium eggs', true),
  (v_store_id, 'Cheddar Cheese 400g', 42.99, 'Dairy', 'Cheddar cheese block', true),
  (v_store_id, 'Butter 500g', 38.99, 'Dairy', 'Salted butter', true),
  (v_store_id, 'Yoghurt 1kg', 28.99, 'Dairy', 'Plain yoghurt', true),
  
  -- MEAT
  (v_store_id, 'Chicken Breasts 1kg', 79.99, 'Meat', 'Fresh chicken breast fillets', true),
  (v_store_id, 'Beef Mince 500g', 54.99, 'Meat', 'Lean beef mince', true),
  (v_store_id, 'Pork Chops 1kg', 89.99, 'Meat', 'Fresh pork chops', true),
  (v_store_id, 'Wors 1kg', 65.99, 'Meat', 'Boerewors', true),
  (v_store_id, 'Chicken Portions 2kg', 85.99, 'Meat', 'Mixed chicken portions', true),
  
  -- BEVERAGES
  (v_store_id, 'Coca-Cola 2L', 21.99, 'Beverages', 'Coca-Cola soft drink', true),
  (v_store_id, 'Coca-Cola 6x330ml', 34.99, 'Beverages', 'Coca-Cola cans', true),
  (v_store_id, 'Orange Juice 1L', 18.99, 'Beverages', 'Fresh orange juice', true),
  (v_store_id, 'Bottled Water 500ml', 8.99, 'Beverages', 'Still water', true),
  (v_store_id, 'Bottled Water 6x500ml', 39.99, 'Beverages', 'Still water pack', true),
  
  -- SNACKS
  (v_store_id, 'Simba Chips 125g', 16.99, 'Snacks', 'Potato chips', true),
  (v_store_id, 'Nik Naks 150g', 18.99, 'Snacks', 'Cheese snacks', true),
  (v_store_id, 'Peanuts 400g', 24.99, 'Snacks', 'Roasted peanuts', true),
  
  -- HOUSEHOLD
  (v_store_id, 'Toilet Paper 9s', 42.99, 'Household', 'Toilet tissue', true),
  (v_store_id, 'Dish Soap 750ml', 18.99, 'Household', 'Dishwashing liquid', true),
  (v_store_id, 'Washing Powder 2kg', 89.99, 'Household', 'Laundry powder', true),
  
  -- FRESH PRODUCE
  (v_store_id, 'Potatoes 2kg', 24.99, 'Fresh Produce', 'Fresh potatoes', true),
  (v_store_id, 'Onions 1kg', 18.99, 'Fresh Produce', 'Brown onions', true),
  (v_store_id, 'Tomatoes 1kg', 22.99, 'Fresh Produce', 'Fresh tomatoes', true),
  (v_store_id, 'Oranges 1kg', 29.99, 'Fresh Produce', 'Navel oranges', true),
  (v_store_id, 'Bananas 1kg', 19.99, 'Fresh Produce', 'Fresh bananas', true);

  RAISE NOTICE 'Successfully imported % products for Checkers', 
    (SELECT COUNT(*) FROM products WHERE store_id = v_store_id);
END $$;
