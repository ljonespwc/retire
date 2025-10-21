-- Seed 2025 provincial basic personal amounts
-- These are the provincial basic personal amounts for tax credit calculations
-- Note: These values are for 2025 and should be updated annually

-- Insert provincial basic personal amounts for all 13 provinces/territories
INSERT INTO tax_credits (year, credit_type, province_code, data) VALUES
-- Alberta
(2025, 'BASIC_PERSONAL_AMOUNT', 'AB', '{"amount": 21885}'::jsonb),

-- British Columbia
(2025, 'BASIC_PERSONAL_AMOUNT', 'BC', '{"amount": 12580}'::jsonb),

-- Manitoba
(2025, 'BASIC_PERSONAL_AMOUNT', 'MB', '{"amount": 15780}'::jsonb),

-- New Brunswick
(2025, 'BASIC_PERSONAL_AMOUNT', 'NB', '{"amount": 13044}'::jsonb),

-- Newfoundland and Labrador
(2025, 'BASIC_PERSONAL_AMOUNT', 'NL', '{"amount": 10382}'::jsonb),

-- Northwest Territories
(2025, 'BASIC_PERSONAL_AMOUNT', 'NT', '{"amount": 16593}'::jsonb),

-- Nova Scotia
(2025, 'BASIC_PERSONAL_AMOUNT', 'NS', '{"amount": 8744}'::jsonb),

-- Nunavut
(2025, 'BASIC_PERSONAL_AMOUNT', 'NU', '{"amount": 17925}'::jsonb),

-- Ontario
(2025, 'BASIC_PERSONAL_AMOUNT', 'ON', '{"amount": 11865}'::jsonb),

-- Prince Edward Island
(2025, 'BASIC_PERSONAL_AMOUNT', 'PE', '{"amount": 13500}'::jsonb),

-- Quebec (Note: Quebec has its own tax system, this is a simplified value)
(2025, 'BASIC_PERSONAL_AMOUNT', 'QC', '{"amount": 18056}'::jsonb),

-- Saskatchewan
(2025, 'BASIC_PERSONAL_AMOUNT', 'SK', '{"amount": 18491}'::jsonb),

-- Yukon
(2025, 'BASIC_PERSONAL_AMOUNT', 'YT', '{"amount": 15705}'::jsonb);

-- Add provincial age amounts where applicable (some provinces have them)
-- Ontario Age Amount (age 65+)
INSERT INTO tax_credits (year, credit_type, province_code, data) VALUES
(2025, 'AGE_AMOUNT', 'ON', '{"max_credit": 6040, "income_threshold": 45365, "reduction_rate": 0.15}'::jsonb);

-- British Columbia Age Amount (age 65+)
INSERT INTO tax_credits (year, credit_type, province_code, data) VALUES
(2025, 'AGE_AMOUNT', 'BC', '{"max_credit": 5100, "income_threshold": 43000, "reduction_rate": 0.15}'::jsonb);

-- Note: Other provinces may have different senior credits or no age amounts
-- This is a simplified implementation for MVP - expand as needed
