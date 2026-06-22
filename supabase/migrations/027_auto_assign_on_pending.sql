-- ============================================================
-- 027_auto_assign_on_pending.sql
--
-- Couples agent assignment to the open→pending transition.
-- Whenever a conversation's status becomes 'pending' and it has no
-- assigned agent yet, this trigger picks the least-loaded eligible
-- agent (fewest open/pending conversations) and assigns them.
--
-- "Least loaded" = a free agent (0 active conversations) always wins;
-- ties broken by earliest profiles.created_at (deterministic).
-- Eligible role: agent only (owners, admins, and viewers excluded).
--
-- BEFORE trigger so it sets NEW.assigned_agent_id directly in the same
-- write — no second UPDATE, no recursion. An explicit assignment made
-- in the same statement (assigned_agent_id already set) is respected.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_assign_on_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent UUID;
BEGIN
  IF NEW.status <> 'pending' OR NEW.assigned_agent_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.user_id INTO v_agent
  FROM profiles p
  LEFT JOIN conversations c
    ON c.assigned_agent_id = p.user_id
   AND c.account_id = p.account_id
   AND c.status IN ('open', 'pending')
   AND c.id <> NEW.id
  WHERE p.account_id = NEW.account_id
    AND p.account_role = 'agent'
  GROUP BY p.user_id, p.created_at
  ORDER BY COUNT(c.id) ASC, p.created_at ASC
  LIMIT 1;

  IF v_agent IS NOT NULL THEN
    NEW.assigned_agent_id := v_agent;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION auto_assign_on_pending() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_auto_assign_on_pending ON conversations;
CREATE TRIGGER trg_auto_assign_on_pending
  BEFORE INSERT OR UPDATE OF status ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_on_pending();
