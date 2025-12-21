-- Create table for storing fund parameters
-- This stores the base fund value and silver holdings

CREATE TABLE IF NOT EXISTS lumepall_fund_params (
  id INTEGER PRIMARY KEY DEFAULT 1,
  base_fund_value DECIMAL(15, 2) NOT NULL DEFAULT 500000,  -- Base fund value in EUR (non-silver portion)
  silver_troy_ounces DECIMAL(15, 4) NOT NULL DEFAULT 5000,  -- Silver holdings in Troy ounces
  silver_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 31.25,  -- Manual silver price in USD per Troy ounce
  base_share_price DECIMAL(10, 4) NOT NULL DEFAULT 1.80,  -- Manual base share price in EUR
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_constraint CHECK (id = 1)  -- Ensure only one row exists
);

-- Enable Row Level Security (RLS)
ALTER TABLE lumepall_fund_params ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on fund params" ON lumepall_fund_params
  FOR SELECT
  USING (true);

-- Create policy to allow public update access
CREATE POLICY "Allow public update access on fund params" ON lumepall_fund_params
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow insert (only one row allowed)
CREATE POLICY "Allow public insert access on fund params" ON lumepall_fund_params
  FOR INSERT
  WITH CHECK (id = 1);

-- Insert initial default values
INSERT INTO lumepall_fund_params (id, base_fund_value, silver_troy_ounces, silver_price_usd, base_share_price)
VALUES (1, 500000, 5000, 31.25, 1.80)
ON CONFLICT (id) DO NOTHING;

-- Verify data was inserted
SELECT * FROM lumepall_fund_params;
