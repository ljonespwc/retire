-- Add provincial tax credits support
-- This migration extends the tax_credits table to support provincial basic personal amounts

-- Add province_code column to tax_credits table (nullable for federal credits)
ALTER TABLE tax_credits
ADD COLUMN province_code TEXT;

-- Add check constraint for province codes
ALTER TABLE tax_credits
ADD CONSTRAINT tax_credits_province_code_check
CHECK (province_code IS NULL OR province_code IN ('AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'));

-- Update composite unique constraint to include province_code
-- Drop old constraint first
ALTER TABLE tax_credits
DROP CONSTRAINT IF EXISTS tax_credits_year_credit_type_key;

-- Add new composite unique constraint
ALTER TABLE tax_credits
ADD CONSTRAINT tax_credits_year_credit_type_province_key
UNIQUE (year, credit_type, province_code);

-- Add comment
COMMENT ON COLUMN tax_credits.province_code IS 'Province/territory code for provincial credits, NULL for federal credits';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_tax_credits_province
ON tax_credits(year, province_code);
