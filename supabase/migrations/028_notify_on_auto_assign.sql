-- ============================================================
-- 028_notify_on_auto_assign.sql
--
-- Fix: auto-assigned conversations did not generate an assignment
-- notification.
--
-- The notification trigger (migration 023) was scoped to
-- `AFTER INSERT OR UPDATE OF assigned_agent_id`. That `OF` clause only
-- fires when `assigned_agent_id` appears in the UPDATE statement's SET
-- list. The auto-assign trigger (migration 027) sets the column from a
-- BEFORE trigger while the statement only SETs `status` — and Postgres
-- ignores BEFORE-trigger column changes when deciding whether an
-- `UPDATE OF column` trigger should fire. So the notification never
-- fired for auto-assignments.
--
-- Broaden the trigger to fire on any UPDATE. The function already
-- returns early unless assigned_agent_id actually changed to a new
-- non-null value, so this stays correct and cheap.
-- ============================================================

DROP TRIGGER IF EXISTS on_conversation_assigned ON conversations;
CREATE TRIGGER on_conversation_assigned
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION notify_conversation_assigned();
