-- McDonald's Modimolle Menu Seed
-- Instructions: 
-- 1. First create the store in Admin panel (or use existing store)
-- 2. Copy this entire file
-- 3. Open Supabase Dashboard -> SQL Editor
-- 4. Paste and click "Run"

-- Get the store_id (verify this matches your store name)
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores WHERE name = 'McDonald''s Modimolle';
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store not found! Create "McDonald''s Modimolle" first in Admin panel.';
  END IF;

  -- Insert products
  INSERT INTO products (store_id, name, price, category, description, available) VALUES
  -- BURGERS
  (v_store_id, 'Big Mac', 45.90, 'Burgers', 'Two beef patties, special sauce, lettuce, cheese', true),
  (v_store_id, 'Quarter Pounder with Cheese', 42.90, 'Burgers', 'Quarter pound beef patty with cheese', true),
  (v_store_id, 'McChicken', 39.90, 'Burgers', 'Crispy chicken fillet burger', true),
  (v_store_id, 'Cheeseburger', 28.90, 'Burgers', 'Beef patty with cheese', true),
  (v_store_id, 'Double Cheeseburger', 35.90, 'Burgers', 'Two beef patties with cheese', true),
  
  -- CHICKEN
  (v_store_id, '6pc Chicken McNuggets', 35.90, 'Chicken', 'Six chicken nuggets', true),
  (v_store_id, '9pc Chicken McNuggets', 48.90, 'Chicken', 'Nine chicken nuggets', true),
  (v_store_id, '20pc Chicken McNuggets', 95.90, 'Chicken', 'Twenty chicken nuggets', true),
  (v_store_id, 'Spicy Chicken Burger', 39.90, 'Chicken', 'Spicy crispy chicken burger', true),
  
  -- BREAKFAST (Available until 10:30am)
  (v_store_id, 'Egg McMuffin', 32.90, 'Breakfast', 'Egg, bacon, and cheese muffin', true),
  (v_store_id, 'Sausage McMuffin', 29.90, 'Breakfast', 'Sausage and egg muffin', true),
  (v_store_id, 'Hotcakes', 28.90, 'Breakfast', 'Pancakes with syrup', true),
  (v_store_id, 'Hash Brown', 14.90, 'Breakfast', 'Crispy potato hash brown', true),
  
  -- SIDES
  (v_store_id, 'Small Fries', 15.90, 'Sides', 'Classic McDonald''s fries', true),
  (v_store_id, 'Medium Fries', 18.90, 'Sides', 'Classic McDonald''s fries', true),
  (v_store_id, 'Large Fries', 21.90, 'Sides', 'Classic McDonald''s fries', true),
  (v_store_id, 'Garden Side Salad', 22.90, 'Sides', 'Fresh salad', true),
  
  -- DRINKS
  (v_store_id, 'Coca-Cola Small', 12.90, 'Drinks', 'Coca-Cola soft drink', true),
  (v_store_id, 'Coca-Cola Medium', 15.90, 'Drinks', 'Coca-Cola soft drink', true),
  (v_store_id, 'Coca-Cola Large', 18.90, 'Drinks', 'Coca-Cola soft drink', true),
  (v_store_id, 'Fanta Orange Medium', 15.90, 'Drinks', 'Orange soft drink', true),
  (v_store_id, 'Sprite Medium', 15.90, 'Drinks', 'Lemon-lime soft drink', true),
  (v_store_id, 'Cappuccino', 18.90, 'Drinks', 'Hot coffee', true),
  (v_store_id, 'Orange Juice', 16.90, 'Drinks', 'Fresh orange juice', true),
  
  -- DESSERTS
  (v_store_id, 'McFlurry Oreo', 28.90, 'Desserts', 'Soft serve with Oreo pieces', true),
  (v_store_id, 'McFlurry Kit Kat', 28.90, 'Desserts', 'Soft serve with Kit Kat pieces', true),
  (v_store_id, 'Apple Pie', 12.90, 'Desserts', 'Baked apple pie', true),
  (v_store_id, 'Soft Serve Cone', 8.90, 'Desserts', 'Vanilla soft serve', true),
  (v_store_id, 'Chocolate Sundae', 16.90, 'Desserts', 'Soft serve with chocolate', true),
  
  -- COMBO MEALS
  (v_store_id, 'Big Mac Meal', 69.90, 'Meals', 'Big Mac + Medium Fries + Medium Drink', true),
  (v_store_id, 'Quarter Pounder Meal', 66.90, 'Meals', 'Quarter Pounder + Medium Fries + Medium Drink', true),
  (v_store_id, 'McChicken Meal', 62.90, 'Meals', 'McChicken + Medium Fries + Medium Drink', true),
  (v_store_id, '9pc Nuggets Meal', 68.90, 'Meals', '9pc Nuggets + Medium Fries + Medium Drink', true);

  RAISE NOTICE 'Successfully imported % products for McDonald''s Modimolle', 
    (SELECT COUNT(*) FROM products WHERE store_id = v_store_id);
END $$;
