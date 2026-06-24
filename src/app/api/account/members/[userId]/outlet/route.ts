// ============================================================
// /api/account/members/[userId]/outlet
//
//   PATCH — change a member's assigned outlet. Admin+.
//
// This route uses `supabaseAdmin` to perform the update because
// the profiles RLS policy only allows user self-updates, but
// we restrict the update to profiles within the admin's own account.
// ============================================================

import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 1. Require admin+ role
    const ctx = await requireRole("admin");
    const { userId } = await params;

    const body = (await request.json().catch(() => null)) as {
      assigned_outlet_id?: string | null;
    } | null;
    const assignedOutletId = body?.assigned_outlet_id || null;

    // 2. Perform the update via the admin client to bypass the RLS restriction on profiles table,
    // but target the specific profile under the caller's account context.
    const adminDb = supabaseAdmin();
    const { error } = await adminDb
      .from("profiles")
      .update({ assigned_outlet_id: assignedOutletId })
      .eq("user_id", userId)
      .eq("account_id", ctx.accountId);

    if (error) {
      console.error("[PATCH /api/account/members/[userId]/outlet] update error:", error);
      return NextResponse.json({ error: "Failed to update member outlet" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
