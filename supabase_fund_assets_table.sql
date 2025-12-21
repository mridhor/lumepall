-- Create table for storing fund total assets history
-- This tracks the cumulative total value of the fund over time
-- Similar to Norwegian sovereign fund's total assets tracking

-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lumepall_fund_assets (
  id BIGSERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_assets DECIMAL(15, 2) NOT NULL,  -- Total fund assets in EUR
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE lumepall_fund_assets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on fund assets" ON lumepall_fund_assets
  FOR SELECT
  USING (true);

-- Create policy to allow public insert/update access
CREATE POLICY "Allow public insert access on fund assets" ON lumepall_fund_assets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on fund assets" ON lumepall_fund_assets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_fund_assets_date ON lumepall_fund_assets(date);

-- Seed with sample data (you should replace this with your actual fund total assets data)
-- This represents the total value of the fund over time (in EUR)
-- Starting from 2015 with initial investment

INSERT INTO lumepall_fund_assets (date, total_assets) VALUES
-- 2015 - Initial investment period (example: starting with 100,000 EUR)
('Jan 5, 2015', 89700),
('Feb 2, 2015', 89850),
('Mar 2, 2015', 90000),
('Apr 6, 2015', 90150),
('May 4, 2015', 90300),
('Jun 1, 2015', 90450),
('Jul 6, 2015', 90600),
('Aug 3, 2015', 90750),
('Sep 7, 2015', 90900),
('Oct 5, 2015', 91050),
('Nov 2, 2015', 91200),
('Dec 7, 2015', 91350),
('Dec 31, 2015', 91500),

-- 2016
('Jan 4, 2016', 91650),
('Feb 1, 2016', 91800),
('Mar 7, 2016', 91950),
('Apr 4, 2016', 92100),
('May 2, 2016', 92250),
('Jun 6, 2016', 92400),
('Jul 5, 2016', 92550),
('Aug 1, 2016', 92700),
('Sep 6, 2016', 92850),
('Oct 3, 2016', 93000),
('Nov 7, 2016', 93150),
('Dec 5, 2016', 93300),
('Dec 31, 2016', 93450),

-- 2017
('Jan 3, 2017', 93600),
('Feb 6, 2017', 93750),
('Mar 6, 2017', 93900),
('Apr 3, 2017', 94050),
('May 1, 2017', 94200),
('Jun 5, 2017', 94350),
('Jul 3, 2017', 94500),
('Aug 7, 2017', 94650),
('Sep 5, 2017', 94800),
('Oct 2, 2017', 94950),
('Nov 6, 2017', 95100),
('Dec 4, 2017', 95250),
('Dec 31, 2017', 95400),

-- 2018
('Jan 2, 2018', 95550),
('Feb 5, 2018', 95700),
('Mar 5, 2018', 95850),
('Apr 2, 2018', 96000),
('May 7, 2018', 96150),
('Jun 4, 2018', 96300),
('Jul 2, 2018', 96450),
('Aug 6, 2018', 96600),
('Sep 4, 2018', 96750),
('Oct 1, 2018', 96900),
('Nov 5, 2018', 97050),
('Dec 3, 2018', 97200),
('Dec 31, 2018', 97350),

-- 2019
('Jan 7, 2019', 97500),
('Feb 4, 2019', 97650),
('Mar 4, 2019', 97800),
('Apr 1, 2019', 97950),
('May 6, 2019', 98100),
('Jun 3, 2019', 98250),
('Jul 1, 2019', 98400),
('Aug 5, 2019', 98550),
('Sep 3, 2019', 98700),
('Oct 7, 2019', 98850),
('Nov 4, 2019', 99000),
('Dec 2, 2019', 99150),
('Dec 31, 2019', 99300),

-- 2020
('Jan 6, 2020', 99450),
('Feb 3, 2020', 99600),
('Mar 2, 2020', 99750),
('Apr 6, 2020', 99850),
('May 4, 2020', 99900),
('Jun 1, 2020', 99940),
('Jul 6, 2020', 99970),
('Aug 3, 2020', 100000),
('Sep 7, 2020', 100020),

-- 2021 - Fund officially starts (assets start growing significantly)
('Jan 5, 2021', 125000),
('Feb 2, 2021', 128000),
('Mar 2, 2021', 131000),
('Apr 5, 2021', 134000),
('May 3, 2021', 155000),
('Jun 1, 2021', 160000),
('Jul 5, 2021', 165000),
('Aug 2, 2021', 170000),
('Sep 6, 2021', 180000),
('Oct 4, 2021', 190000),
('Nov 1, 2021', 205000),
('Dec 6, 2021', 215000),
('Dec 31, 2021', 220000),

-- 2022
('Jan 3, 2022', 222000),
('Feb 7, 2022', 230000),
('Mar 7, 2022', 238000),
('Apr 4, 2022', 242000),
('May 2, 2022', 248000),
('Jun 6, 2022', 265000),
('Jul 4, 2022', 272000),
('Aug 1, 2022', 280000),
('Sep 5, 2022', 288000),
('Oct 3, 2022', 295000),
('Nov 7, 2022', 310000),
('Dec 5, 2022', 322000),
('Dec 31, 2022', 328000),

-- 2023
('Jan 2, 2023', 330000),
('Feb 6, 2023', 335000),
('Mar 6, 2023', 345000),
('Apr 3, 2023', 352000),
('May 1, 2023', 358000),
('Jun 5, 2023', 365000),
('Jul 3, 2023', 375000),
('Aug 7, 2023', 382000),
('Sep 4, 2023', 392000),
('Oct 2, 2023', 398000),
('Nov 6, 2023', 410000),
('Dec 4, 2023', 425000),
('Dec 31, 2023', 435000),

-- 2024
('Jan 15, 2024', 438000),
('Feb 5, 2024', 448000),
('Mar 4, 2024', 462000),
('Apr 1, 2024', 478000),
('May 6, 2024', 488000),
('Jun 3, 2024', 495000),
('Jul 1, 2024', 505000),
('Aug 5, 2024', 518000),
('Sep 2, 2024', 535000),
('Oct 7, 2024', 548000),
('Nov 4, 2024', 555000),
('Dec 2, 2024', 568000),
('Dec 31, 2024', 575000),

-- 2025 - Current year
('Jan 6, 2025', 580000),
('Feb 3, 2025', 595000),
('Mar 3, 2025', 608000),
('Apr 7, 2025', 618000),
('May 5, 2025', 628000),
('Jun 2, 2025', 638000),
('Jul 7, 2025', 652000),
('Aug 4, 2025', 665000),
('Sep 1, 2025', 678000),
('Oct 6, 2025', 692000),
('Nov 3, 2025', 705000),
('Dec 1, 2025', 718000)

ON CONFLICT (date) DO UPDATE SET total_assets = EXCLUDED.total_assets;

-- Verify data was inserted
SELECT COUNT(*) as total_records FROM lumepall_fund_assets;
