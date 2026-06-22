-- Drop the toggle and round-robin pointer columns from accounts.
-- Auto-assignment now always runs on every new inbound message;
-- the least-loaded agent is picked dynamically from live conversation counts.

ALTER TABLE accounts
  DROP COLUMN IF EXISTS auto_assign_enabled,
  DROP COLUMN IF EXISTS auto_assign_last_agent_id;
