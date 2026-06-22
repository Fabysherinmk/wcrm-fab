import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Pick the least-loaded eligible agent for an account.
 *
 * "Least loaded" = fewest open/pending conversations currently assigned.
 * A free agent (0 active conversations) is always preferred over a busy one.
 * Ties are broken by earliest created_at (deterministic, avoids thrash).
 *
 * Eligible role: agent only (owners, admins, and viewers excluded).
 *
 * Returns null when the account has no eligible members.
 *
 * Must be called with a service-role client so it can read profiles and
 * conversations regardless of RLS.
 *
 * Note: new inbound conversations are auto-assigned at the DB level by the
 * `auto_assign_on_pending` trigger (migration 027). This helper exists for
 * the automations engine's explicit "assign (round-robin)" step.
 */
export async function pickLeastLoadedAgent(
  accountId: string,
  db: SupabaseClient,
): Promise<string | null> {
  const { data: agents, error: agentsErr } = await db
    .from('profiles')
    .select('user_id')
    .eq('account_id', accountId)
    .eq('account_role', 'agent')
    .order('created_at', { ascending: true })

  if (agentsErr) {
    console.error('[auto-assign] failed to fetch agents:', agentsErr.message)
    return null
  }
  if (!agents || agents.length === 0) {
    console.warn('[auto-assign] no eligible agents for account', accountId)
    return null
  }

  const agentIds: string[] = agents.map((a: { user_id: string }) => a.user_id)

  const { data: convs, error: convsErr } = await db
    .from('conversations')
    .select('assigned_agent_id')
    .eq('account_id', accountId)
    .in('status', ['open', 'pending'])
    .in('assigned_agent_id', agentIds)

  if (convsErr) {
    console.error('[auto-assign] failed to fetch conversation counts:', convsErr.message)
    return agentIds[0]
  }

  const loadMap = new Map<string, number>(agentIds.map(id => [id, 0]))
  for (const conv of (convs ?? [])) {
    const id = (conv as { assigned_agent_id: string }).assigned_agent_id
    if (loadMap.has(id)) loadMap.set(id, (loadMap.get(id) ?? 0) + 1)
  }

  // Pick agent with lowest load; ties broken by position (earliest created_at)
  let bestId = agentIds[0]
  let bestLoad = loadMap.get(bestId) ?? 0
  for (let i = 1; i < agentIds.length; i++) {
    const load = loadMap.get(agentIds[i]) ?? 0
    if (load < bestLoad) {
      bestId = agentIds[i]
      bestLoad = load
    }
  }

  return bestId
}
