-- SQL queries to insert fund assets data into Supabase
-- Run these in your Supabase SQL Editor

-- First, ensure the table exists with correct schema
CREATE TABLE IF NOT EXISTS lumepall_fund_assets (
  id BIGSERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_assets DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add UNIQUE constraint if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lumepall_fund_assets_date_key'
  ) THEN
    ALTER TABLE lumepall_fund_assets ADD CONSTRAINT lumepall_fund_assets_date_key UNIQUE (date);
  END IF;
END $$;

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_fund_assets_date ON lumepall_fund_assets(date);

-- Enable RLS
ALTER TABLE lumepall_fund_assets ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lumepall_fund_assets' AND policyname = 'Allow public read'
  ) THEN
    CREATE POLICY "Allow public read" ON lumepall_fund_assets FOR SELECT USING (true);
  END IF;
END $$;

-- Insert fund assets data from Excel file
-- Investment Partnership Period (2013-2020)
INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Aug 8, 2013', 2500)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2014', 6139)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2015', 15997)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2016', 22095)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2017', 71600)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2018', 327801)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2019', 399880)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2020', 376403)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

-- Official Fund Period (2021-2025)
INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2021', 462964)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2022', 996929)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2023', 1334873)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2024', 1653617)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

INSERT INTO lumepall_fund_assets (date, total_assets)
VALUES ('Dec 31, 2025', 2268755)
ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

-- Verify the data
SELECT date, total_assets FROM lumepall_fund_assets ORDER BY date;
