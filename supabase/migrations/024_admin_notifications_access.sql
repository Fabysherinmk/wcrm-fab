-- ============================================================
-- 024_admin_notifications_access.sql — Admin notifications access
--
-- Updates the Row Level Security (RLS) policies on the `notifications`
-- table to allow account admins (and owners) to view and modify
-- (e.g. mark as read) all notifications within their account.
--
-- Uses the existing `is_account_member(account_id, 'admin')` helper
-- function to authorize access.
-- ============================================================

DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;

CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_account_member(account_id, 'admin')
  );

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR is_account_member(account_id, 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR is_account_member(account_id, 'admin')
  );
