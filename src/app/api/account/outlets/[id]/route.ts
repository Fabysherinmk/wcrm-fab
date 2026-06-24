// ============================================================
// /api/account/outlets/[id]
//
//   DELETE — Delete an outlet by ID. Admin+.
// ============================================================

import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole("admin");
    const { id } = await params;

    const { error } = await ctx.supabase
      .from("outlets")
      .delete()
      .eq("id", id)
      .eq("account_id", ctx.accountId);

    if (error) {
      console.error("[DELETE /api/account/outlets/[id]] delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete outlet" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
