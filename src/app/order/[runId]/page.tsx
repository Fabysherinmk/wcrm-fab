import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import OrderForm from "./order-form";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (!runId) {
    notFound();
  }

  const db = supabaseAdmin();

  // 1. Fetch the flow run
  const { data: run, error: runError } = await db
    .from("flow_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (runError || !run) {
    notFound();
  }

  // 2. Only allow active runs
  if (run.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-100 font-sans">
        <div className="max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-amber-500">Session Expired</h1>
          <p className="text-slate-400">
            This ordering session has expired or has already been completed. Please send a new message to Al-wow boofya on WhatsApp to start a new order.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch outlets for the account
  const { data: outlets } = await db
    .from("outlets")
    .select("id, name, latitude, longitude")
    .eq("account_id", run.account_id);

  // 4. Render client order form
  return <OrderForm run={run} initialOutlets={outlets ?? []} />;
}
