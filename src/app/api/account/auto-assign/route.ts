// ============================================================
// GET  /api/account/auto-assign  — read current setting (any member)
// PATCH /api/account/auto-assign — toggle setting (admin+ only)
// ============================================================

import { NextResponse } from 'next/server'
import { getCurrentAccount, requireRole, toErrorResponse } from '@/lib/auth/account'

export async function GET() {
  try {
    const ctx = await getCurrentAccount()
    const { data, error } = await ctx.supabase
      .from('accounts')
      .select('auto_assign_enabled')
      .eq('id', ctx.accountId)
      .single()

    if (error) {
      console.error('[GET /api/account/auto-assign] fetch error:', error)
      return NextResponse.json({ error: 'Failed to load setting' }, { status: 500 })
    }

    return NextResponse.json({ auto_assign_enabled: data.auto_assign_enabled ?? false })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole('admin')

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { auto_assign_enabled } = body as Record<string, unknown>
    if (typeof auto_assign_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'auto_assign_enabled must be a boolean' },
        { status: 400 },
      )
    }

    const { error } = await ctx.supabase
      .from('accounts')
      .update({ auto_assign_enabled })
      .eq('id', ctx.accountId)

    if (error) {
      console.error('[PATCH /api/account/auto-assign] update error:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ auto_assign_enabled })
  } catch (err) {
    return toErrorResponse(err)
  }
}
