-- Seed McDonald's Modimolle store and a starter menu
-- Run this in Supabase SQL editor. Adjust prices/items to match the local store.

BEGIN;

-- Create store (id captured via CTE)
WITH new_store AS (
  INSERT INTO stores (
    name, category, phone_number, description,
    street_address, township, town, gps_latitude, gps_longitude,
    open_time, close_time, operating_days, status, custom_orders_only
  ) VALUES (
    'McDonald''s Modimolle', 'restaurant', '010 123 4567', 'McDonald''s Modimolle – burgers, meals, and more.',
    'Modimolle (Nylstroom) Town Centre', 'Modimolle', 'modimolle', NULL, NULL,
    '07:00', '23:00', 'Mon-Sun', 'active', FALSE
  )
  RETURNING id
)
INSERT INTO products (store_id, name, description, price, category, available)
SELECT id, p.name, p.description, p.price, p.category, TRUE
FROM new_store, (
  VALUES
    ('Big Mac Meal', 'Big Mac, medium fries, medium drink', 79.90, 'Meals'),
    ('Quarter Pounder with Cheese Meal', 'QP w/ Cheese, medium fries, medium drink', 89.90, 'Meals'),
    ('McChicken Meal', 'McChicken, medium fries, medium drink', 69.90, 'Meals'),
    ('Chicken McNuggets (10pc)', '10pc nuggets with choice of sauce', 69.90, 'Chicken'),
    ('Medium Fries', 'Golden fries', 24.90, 'Sides'),
    ('Coca-Cola (500ml)', '500ml bottle', 19.90, 'Drinks'),
    ('Oreo McFlurry', 'Soft serve with Oreo', 34.90, 'Desserts')
) AS p(name, description, price, category);

COMMIT;
