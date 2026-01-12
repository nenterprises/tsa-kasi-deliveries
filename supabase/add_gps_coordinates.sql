-- Add GPS coordinates and detailed address fields to orders table
-- Run this in Supabase SQL editor

-- Add delivery address fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_address_formatted TEXT,
ADD COLUMN IF NOT EXISTS delivery_gps_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_gps_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_street TEXT,
ADD COLUMN IF NOT EXISTS delivery_street_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_locality TEXT,
ADD COLUMN IF NOT EXISTS delivery_region TEXT,
ADD COLUMN IF NOT EXISTS delivery_postal_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_special_instructions TEXT,
ADD COLUMN IF NOT EXISTS delivery_distance_km DECIMAL(6, 2);

-- Add indexes for geospatial queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_gps ON orders(delivery_gps_lat, delivery_gps_lng);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_locality ON orders(delivery_locality);

-- Add GPS coordinates to stores table (if not already present)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS gps_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS gps_longitude DECIMAL(11, 8);

-- Create index for store locations
CREATE INDEX IF NOT EXISTS idx_stores_gps ON stores(gps_latitude, gps_longitude);

-- Update existing stores with NULL coordinates to have default Modimolle center
-- (You can update specific stores later with accurate coordinates)
UPDATE stores 
SET gps_latitude = -24.6958, 
    gps_longitude = 28.4206
WHERE gps_latitude IS NULL 
  AND town = 'modimolle';

-- Comment explaining the coordinate system
COMMENT ON COLUMN orders.delivery_gps_lat IS 'Delivery latitude in decimal degrees (WGS84)';
COMMENT ON COLUMN orders.delivery_gps_lng IS 'Delivery longitude in decimal degrees (WGS84)';
COMMENT ON COLUMN stores.gps_latitude IS 'Store latitude in decimal degrees (WGS84)';
COMMENT ON COLUMN stores.gps_longitude IS 'Store longitude in decimal degrees (WGS84)';
