import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import { dispatchInboundToFlows } from "@/lib/flows/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      runId,
      cart,
      total,
      address,
      coords,
      googleMapsLink,
      customizations,
    } = body;

    if (!runId) {
      return NextResponse.json({ error: "runId is required" }, { status: 400 });
    }
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "cart items are required" }, { status: 400 });
    }
    if (!address || !address.place || !address.roadRoute || !address.houseNumber) {
      return NextResponse.json({ error: "complete address details are required" }, { status: 400 });
    }
    if (!coords || coords.lat === null || coords.lng === null) {
      return NextResponse.json({ error: "coordinates are required" }, { status: 400 });
    }

    const db = supabaseAdmin();

    // 1. Load active run
    const { data: run, error: runError } = await db
      .from("flow_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();

    if (runError || !run) {
      return NextResponse.json({ error: "Flow run not found" }, { status: 404 });
    }
    if (run.status !== "active") {
      return NextResponse.json({ error: "This ordering session has expired" }, { status: 400 });
    }

    // 2. Build summary string
    const orderSummaryText = cart
      .map((item: any) => `• ${item.name} x${item.quantity}`)
      .join("\n");

    const fullAddressText = `${address.houseNumber}, ${address.roadRoute}, ${address.place}`;

    // 3. Format location string with coords for the flow engine parser
    const locationMessageText = `${fullAddressText} - ${coords.lat},${coords.lng}`;

    // 4. Update the variables in DB
    const currentVars = run.vars || {};
    const newVars = {
      ...currentVars,
      order_summary: orderSummaryText,
      customizations: customizations ? customizations.trim() : "None",
      order_total: `₹${total}`,
      customer_address: fullAddressText,
    };

    const { error: updateError } = await db
      .from("flow_runs")
      .update({ vars: newVars })
      .eq("id", run.id);

    if (updateError) {
      console.error("[order/submit] failed to update flow run vars:", updateError.message);
      return NextResponse.json({ error: "Failed to update order state" }, { status: 500 });
    }

    // Mirror the updated vars to in-memory run for the engine dispatch call
    run.vars = newVars;

    // 5. Dispatch synthetic inbound location message to advance flow
    const dispatchResult = await dispatchInboundToFlows({
      accountId: run.account_id,
      userId: run.user_id,
      contactId: run.contact_id!,
      conversationId: run.conversation_id!,
      message: {
        kind: "text",
        text: locationMessageText,
        meta_message_id: `web-order-${run.id}-${crypto.randomUUID()}`,
      },
      isFirstInboundMessage: false,
    });

    if (!dispatchResult.consumed) {
      console.error("[order/submit] dispatchInboundToFlows failed to consume coordinates:", dispatchResult);
      return NextResponse.json({ error: "Flow runner rejected order submission" }, { status: 500 });
    }

    return NextResponse.json({ success: true, flow_run_id: run.id });
  } catch (err) {
    console.error("[order/submit] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
