-- ============================================================
-- 024_auto_assign.sql — Account-level round-robin auto-assignment
--
-- Adds two columns to `accounts`:
--
--   auto_assign_enabled        BOOLEAN  — master toggle. When true,
--     every new inbound conversation that has no assigned agent is
--     automatically routed to the next agent in the rotation.
--
--   auto_assign_last_agent_id  UUID     — tracks which agent was
--     most recently auto-assigned so the next assignment can advance
--     the pointer. NULL means "start from the beginning". Updated
--     atomically by the application layer each time a pick is made.
--     ON DELETE SET NULL so removing an agent resets the pointer
--     rather than breaking the FK.
--
-- No new RLS policies are required:
--   SELECT — existing `accounts_select` policy already allows any
--     account member to read the accounts row.
--   UPDATE — existing `accounts_update` policy already allows
--     admin+ to update the accounts row (migration 017).
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS auto_assign_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_assign_last_agent_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;
