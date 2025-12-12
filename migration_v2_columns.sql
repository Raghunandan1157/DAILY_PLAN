-- Add individual columns for daily_reports
-- Run this in your Supabase SQL Editor

ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS ftod_actual bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS ftod_plan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS lived_actual bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS lived_plan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnpa_actual bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnpa_plan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS npa_activation bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS npa_closure bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS fy_od_acc bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS fy_od_plan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS fy_non_start_acc bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS fy_non_start_plan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_sanc_pent_acc bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_sanc_pent_amt bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_igl_acc bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_igl_amt bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_jl_acc bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_jl_amt bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS disb_notes text,
ADD COLUMN IF NOT EXISTS kyc_fig_igl bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS kyc_il bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS kyc_npa bigint DEFAULT 0;

-- Optional: You can drop the 'data' column if you want to be strict, 
-- but keeping it might be useful if you need to access old records before migration.
-- ALTER TABLE daily_reports DROP COLUMN data;
