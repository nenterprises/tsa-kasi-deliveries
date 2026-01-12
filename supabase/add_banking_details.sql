-- Add banking details fields to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('savings', 'current', 'cheque', NULL));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS branch_code TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS banking_details_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS banking_details_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for searching by bank account (for admin verification)
CREATE INDEX IF NOT EXISTS idx_stores_account_number ON stores(account_number) WHERE account_number IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN stores.bank_name IS 'Name of the bank (e.g., Standard Bank, FNB, Capitec)';
COMMENT ON COLUMN stores.account_holder_name IS 'Name on the bank account';
COMMENT ON COLUMN stores.account_number IS 'Bank account number';
COMMENT ON COLUMN stores.account_type IS 'Type of bank account (savings, current, cheque)';
COMMENT ON COLUMN stores.branch_code IS 'Bank branch code';
COMMENT ON COLUMN stores.banking_details_verified IS 'Whether admin has verified the banking details';
COMMENT ON COLUMN stores.banking_details_updated_at IS 'Timestamp when banking details were last updated';
