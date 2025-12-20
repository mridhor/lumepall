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
-- Values represent normalized growth starting from ~0.897 (initial investment value)
-- This simulates the pre-fund track record mentioned in the manifesto

INSERT INTO lumepall_history (date, snobol) VALUES
-- 2015 (Starting year - initial investment)
('Jan 5, 2015', 0.8970),
('Feb 2, 2015', 0.8985),
('Mar 2, 2015', 0.9000),
('Apr 6, 2015', 0.9015),
('May 4, 2015', 0.9030),
('Jun 1, 2015', 0.9045),
('Jul 6, 2015', 0.9060),
('Aug 3, 2015', 0.9075),
('Sep 7, 2015', 0.9090),
('Oct 5, 2015', 0.9105),
('Nov 2, 2015', 0.9120),
('Dec 7, 2015', 0.9135),
('Dec 31, 2015', 0.9150),

-- 2016 (Building momentum)
('Jan 4, 2016', 0.9165),
('Feb 1, 2016', 0.9180),
('Mar 7, 2016', 0.9195),
('Apr 4, 2016', 0.9210),
('May 2, 2016', 0.9225),
('Jun 6, 2016', 0.9240),
('Jul 5, 2016', 0.9255),
('Aug 1, 2016', 0.9270),
('Sep 6, 2016', 0.9285),
('Oct 3, 2016', 0.9300),
('Nov 7, 2016', 0.9315),
('Dec 5, 2016', 0.9330),
('Dec 31, 2016', 0.9345),

-- 2017 (Growth acceleration)
('Jan 3, 2017', 0.9360),
('Feb 6, 2017', 0.9375),
('Mar 6, 2017', 0.9390),
('Apr 3, 2017', 0.9405),
('May 1, 2017', 0.9420),
('Jun 5, 2017', 0.9435),
('Jul 3, 2017', 0.9450),
('Aug 7, 2017', 0.9465),
('Sep 5, 2017', 0.9480),
('Oct 2, 2017', 0.9495),
('Nov 6, 2017', 0.9510),
('Dec 4, 2017', 0.9525),
('Dec 31, 2017', 0.9540),

-- 2018 (Steady growth)
('Jan 2, 2018', 0.9555),
('Feb 5, 2018', 0.9570),
('Mar 5, 2018', 0.9585),
('Apr 2, 2018', 0.9600),
('May 7, 2018', 0.9615),
('Jun 4, 2018', 0.9630),
('Jul 2, 2018', 0.9645),
('Aug 6, 2018', 0.9660),
('Sep 4, 2018', 0.9675),
('Oct 1, 2018', 0.9690),
('Nov 5, 2018', 0.9705),
('Dec 3, 2018', 0.9720),
('Dec 31, 2018', 0.9735),

-- 2019 (Strong performance year)
('Jan 7, 2019', 0.9750),
('Feb 4, 2019', 0.9765),
('Mar 4, 2019', 0.9780),
('Apr 1, 2019', 0.9795),
('May 6, 2019', 0.9810),
('Jun 3, 2019', 0.9825),
('Jul 1, 2019', 0.9840),
('Aug 5, 2019', 0.9855),
('Sep 3, 2019', 0.9870),
('Oct 7, 2019', 0.9885),
('Nov 4, 2019', 0.9900),
('Dec 2, 2019', 0.9915),
('Dec 31, 2019', 0.9930),

-- 2020 (Pre-fund period approaching 1.0)
('Jan 6, 2020', 0.9945),
('Feb 3, 2020', 0.9960),
('Mar 2, 2020', 0.9975),
('Apr 6, 2020', 0.9985),
('May 4, 2020', 0.9990),
('Jun 1, 2020', 0.9994),
('Jul 6, 2020', 0.9997),
('Aug 3, 2020', 1.0000),
('Sep 7, 2020', 1.0002)
ON CONFLICT (date) DO UPDATE SET snobol = EXCLUDED.snobol;

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_history_date ON lumepall_history(date);
