-- Add access_code column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_access_code ON stores(access_code);

-- Function to generate unique access code
CREATE OR REPLACE FUNCTION generate_store_access_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code (uppercase)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM stores WHERE access_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Generate access codes for existing stores that don't have one
UPDATE stores 
SET access_code = generate_store_access_code()
WHERE access_code IS NULL;

-- Make access_code NOT NULL after populating existing records
ALTER TABLE stores ALTER COLUMN access_code SET NOT NULL;

-- Trigger to auto-generate access code for new stores
CREATE OR REPLACE FUNCTION auto_generate_store_access_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL THEN
    NEW.access_code := generate_store_access_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_store_access_code ON stores;
CREATE TRIGGER trigger_auto_generate_store_access_code
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_store_access_code();
