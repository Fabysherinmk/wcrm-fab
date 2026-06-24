-- ============================================================
-- 029_nearest_outlet_node.sql
--
-- Adds support for 'nearest_outlet' node type in conversational flows:
--
--   1. New 'nearest_outlet' value on `flow_nodes.node_type` CHECK
--      constraint.
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE flow_nodes
  DROP CONSTRAINT IF EXISTS flow_nodes_node_type_check;

ALTER TABLE flow_nodes
  ADD CONSTRAINT flow_nodes_node_type_check
  CHECK (node_type IN (
    'start',
    'send_buttons',
    'send_list',
    'send_message',
    'send_media',
    'collect_input',
    'condition',
    'set_tag',
    'handoff',
    'http_fetch',
    'nearest_outlet',
    'end'
  ));
