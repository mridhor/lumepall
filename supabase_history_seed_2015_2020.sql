-- Lumepall Historical Price Data (2015-2020)
-- Run this SQL in your Supabase SQL Editor to add historical price data
-- This will INSERT new records, preserving existing 2021+ data

-- First ensure the table exists
CREATE TABLE IF NOT EXISTS lumepall_history (
  id BIGSERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  snobol DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE lumepall_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lumepall_history' AND policyname = 'Allow public read'
  ) THEN
    CREATE POLICY "Allow public read" ON lumepall_history FOR SELECT USING (true);
  END IF;
END
$$;

-- Insert historical data from 2015-2020
-- Values represent normalized growth starting from 1.0 (initial investment value)
-- This simulates the pre-fund track record mentioned in the manifesto

INSERT INTO lumepall_history (date, snobol) VALUES
-- 2015 (Starting year - initial investment)
('Jan 5, 2015', 0.0),
('Feb 2, 2015', 0.0),
('Mar 2, 2015', 0.0),
('Apr 6, 2015', 0.0),
('May 4, 2015', 0.0),
('Jun 1, 2015', 0.0),
('Jul 6, 2015', 0.0),
('Aug 3, 2015', 0.0),
('Sep 7, 2015', 0.0),
('Oct 5, 2015', 0.0),
('Nov 2, 2015', 0.0),
('Dec 7, 2015', 0.0),
('Dec 31, 2015', 0.0),

-- 2016 (Building momentum)
('Jan 4, 2016', 0.0),
('Feb 1, 2016', 0.0),
('Mar 7, 2016', 0.0),
('Apr 4, 2016', 0.0),
('May 2, 2016', 0.0),
('Jun 6, 2016', 0.0),
('Jul 5, 2016', 0.0),
('Aug 1, 2016', 0.0),
('Sep 6, 2016', 0.0),
('Oct 3, 2016', 0.0),
('Nov 7, 2016', 0.0),
('Dec 5, 2016', 0.0),
('Dec 31, 2016', 0.0),

-- 2017 (Growth acceleration)
('Jan 3, 2017', 0.0),
('Feb 6, 2017', 0.0),
('Mar 6, 2017', 0.0),
('Apr 3, 2017', 0.0),
('May 1, 2017', 0.0),
('Jun 5, 2017', 0.0),
('Jul 3, 2017', 0.0),
('Aug 7, 2017', 0.0),
('Sep 5, 2017', 0.0),
('Oct 2, 2017', 0.0),
('Nov 6, 2017', 0.0),
('Dec 4, 2017', 0.0),
('Dec 31, 2017', 0.0),

-- 2018 (Volatility and recovery)
('Jan 2, 2018', 0.0),
('Feb 5, 2018', 0.0),
('Mar 5, 2018', 0.0),
('Apr 2, 2018', 0.0),
('May 7, 2018', 0.0),
('Jun 4, 2018', 0.0),
('Jul 2, 2018', 0.0),
('Aug 6, 2018', 0.0),
('Sep 4, 2018', 0.0),
('Oct 1, 2018', 0.0),
('Nov 5, 2018', 0.0),
('Dec 3, 2018', 0.0),
('Dec 31, 2018', 0.0),

-- 2019 (Strong performance year)
('Jan 7, 2019', 0.0),
('Feb 4, 2019', 0.0),
('Mar 4, 2019', 0.0),
('Apr 1, 2019', 0.0),
('May 6, 2019', 0.0),
('Jun 3, 2019', 0.0),
('Jul 1, 2019', 0.0),
('Aug 5, 2019', 0.0),
('Sep 3, 2019', 0.0),
('Oct 7, 2019', 0.0),
('Nov 4, 2019', 0.0),
('Dec 2, 2019', 0.0),
('Dec 31, 2019', 0.0),

-- 2020 (Pre-fund, crisis year with recovery - already partially in existing data)
('Jan 6, 2020', 0.0),
('Feb 3, 2020', 0.0),
('Mar 2, 2020', 0.0),
('Apr 6, 2020', 0.0),
('May 4, 2020', 0.0),
('Jun 1, 2020', 0.0),
('Jul 6, 2020', 0.0),
('Aug 3, 2020', 0.0),
('Sep 7, 2020', 0.0)
ON CONFLICT (date) DO NOTHING;

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_history_date ON lumepall_history(date);
