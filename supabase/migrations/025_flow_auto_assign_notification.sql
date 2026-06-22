-- ============================================================
-- 025_flow_auto_assign_notification.sql
--
-- Updates the notify_conversation_assigned trigger to produce a
-- meaningful notification body when the assignment is made by the
-- flow engine (service-role key → auth.uid() IS NULL) rather than
-- a signed-in user.
--
-- Before: "Someone assigned you a conversation with <contact>"
-- After (system):  "Auto-assigned: conversation with <contact>"
-- After (user):    "<Name> assigned you a conversation with <contact>"
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_conversation_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_name TEXT;
  v_actor_name   TEXT;
  v_body         TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_agent_id IS NULL THEN
      RETURN NEW;
    END IF;
  ELSE
    IF NEW.assigned_agent_id IS NULL
       OR NEW.assigned_agent_id IS NOT DISTINCT FROM OLD.assigned_agent_id THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Skip self-assignment — nothing to notify the agent about.
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.assigned_agent_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(name, ''), phone) INTO v_contact_name
  FROM contacts WHERE id = NEW.contact_id;

  IF auth.uid() IS NOT NULL THEN
    SELECT full_name INTO v_actor_name
    FROM profiles WHERE user_id = auth.uid();
  END IF;

  -- auth.uid() IS NULL means a system/flow assignment (service-role key).
  IF auth.uid() IS NULL THEN
    v_body := 'Auto-assigned: conversation with '
              || COALESCE(v_contact_name, 'a contact');
  ELSE
    v_body := COALESCE(v_actor_name, 'Someone')
              || ' assigned you a conversation with '
              || COALESCE(v_contact_name, 'a contact');
  END IF;

  INSERT INTO notifications (
    account_id, user_id, type, conversation_id, contact_id,
    actor_user_id, title, body
  ) VALUES (
    NEW.account_id,
    NEW.assigned_agent_id,
    'conversation_assigned',
    NEW.id,
    NEW.contact_id,
    auth.uid(),
    'New conversation assigned',
    v_body
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification failure block the assignment itself.
  RAISE WARNING 'Failed to create assignment notification for conversation %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION notify_conversation_assigned() OWNER TO postgres;