// ============================================================
// /api/account/outlets
//
//   GET  — List all outlets for this account. Viewer+.
//   POST — Create a new outlet for this account. Admin+.
// ============================================================

import { NextResponse } from "next/server";
import { requireRole, toErrorResponse } from "@/lib/auth/account";

export async function GET() {
  try {
    const ctx = await requireRole("viewer");

    const { data, error } = await ctx.supabase
      .from("outlets")
      .select("id, name, latitude, longitude, created_at")
      .eq("account_id", ctx.accountId)
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/account/outlets] fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch outlets" },
        { status: 500 },
      );
    }

    return NextResponse.json({ outlets: data || [] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole("admin");

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    } | null;

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const latitude = typeof body?.latitude === "number" ? body.latitude : NaN;
    const longitude = typeof body?.longitude === "number" ? body.longitude : NaN;

    if (!name) {
      return NextResponse.json(
        { error: "Outlet name is required" },
        { status: 400 },
      );
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Valid latitude (-90 to 90) is required" },
        { status: 400 },
      );
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Valid longitude (-180 to 180) is required" },
        { status: 400 },
      );
    }

    const { data, error } = await ctx.supabase
      .from("outlets")
      .insert({
        account_id: ctx.accountId,
        name,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/account/outlets] insert error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An outlet with this name already exists in this account" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Failed to create outlet" },
        { status: 500 },
      );
    }

    return NextResponse.json({ outlet: data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
