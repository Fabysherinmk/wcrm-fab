-- ============================================================
-- 030_outlets.sql
--
-- Adds support for global outlets management and agent assignments:
--   1. Creates the `outlets` table with RLS.
--   2. Adds `assigned_outlet_id` column to `profiles`.
-- ============================================================

CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outlets_account_name_unique UNIQUE(account_id, name)
);

ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outlets_select ON outlets;
CREATE POLICY outlets_select ON outlets
  FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS outlets_insert ON outlets;
CREATE POLICY outlets_insert ON outlets
  FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS outlets_update ON outlets;
CREATE POLICY outlets_update ON outlets
  FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS outlets_delete ON outlets;
CREATE POLICY outlets_delete ON outlets
  FOR DELETE
  USING (is_account_member(account_id, 'admin'));

-- Add assigned_outlet_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL;
