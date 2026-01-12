-- Update McDonald's Modimolle with banking details
-- This adds banking info to existing store so profile wizard won't show

UPDATE stores
SET 
  bank_name = 'FNB',
  account_holder_name = 'McDonald''s Modimolle',
  account_number = '1234567890',
  account_type = 'current',
  branch_code = '250655',
  banking_details_updated_at = NOW()
WHERE name = 'McDonald''s Modimolle' 
  AND town = 'modimolle';
