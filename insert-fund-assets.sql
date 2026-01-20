-- SQL queries to insert fund assets data into Supabase
-- Run these in your Supabase SQL Editor

-- First, clear existing data (optional - remove this if you want to keep other data)
-- DELETE FROM lumepall_fund_assets;

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
