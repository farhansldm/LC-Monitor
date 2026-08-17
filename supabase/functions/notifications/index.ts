import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-cron-secret",
  };
}

function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function yesterdayIst(): string {
  const [y, m, d] = todayIst().split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d - 1);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return `${h}h ${min}m`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; stubbed: boolean }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "LC Monitor <beth.t@example.com>";
  if (!apiKey) {
    console.log("[notifications stub]", { to, subject, html: html.slice(0, 200) });
    return { sent: false, stubbed: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error", res.status, text);
    throw new Error(`Resend failed: ${res.status}`);
  }
  return { sent: true, stubbed: false };
}

function isAuthorized(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET") || Deno.env.get("NOTIFICATIONS_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) return true;

  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (token && serviceKey && token === serviceKey) return true;

  // Allow internal calls that already passed verify_jwt=false but include service role as apikey
  const apikey = req.headers.get("apikey") || "";
  if (serviceKey && apikey === serviceKey) return true;

  return false;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Forbidden" }, 403);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const action = parts[parts.length - 1] === "notifications" ? "" : parts[parts.length - 1];
  const body = await req.json().catch(() => ({}));
  const type = (body.type || action || "").toString();

  try {
    if (type === "leave") {
      const to = typeof body.to === "string" ? body.to : "";
      const status = body.status === "APPROVED" ? "APPROVED" : "REJECTED";
      const date = body.date || "";
      const comment = typeof body.comment === "string" ? body.comment : "";
      const name = typeof body.name === "string" ? body.name : "there";
      if (!to) return json({ error: "to is required" }, 400);
      const result = await sendEmail(
        to,
        `Leave request ${status.toLowerCase()}`,
        `<p>Hi ${name},</p><p>Your leave request for <strong>${date}</strong> was <strong>${status}</strong>.</p>${comment ? `<p>Comment: ${comment}</p>` : ""}<p>— LC Monitor</p>`,
      );
      return json({ ok: true, ...result });
    }

    if (type === "missed-clock-out") {
      const date = todayIst();
      const { data: openSessions, error } = await supabase
        .from("work_sessions")
        .select("id, user_id, start_time, date")
        .eq("date", date)
        .is("end_time", null);
      if (error) throw error;

      const userIds = [...new Set((openSessions || []).map((s: { user_id: string }) => s.user_id))];
      const { data: users } = userIds.length
        ? await supabase.from("users").select("id, email, first_name").in("id", userIds)
        : { data: [] };

      const byId = Object.fromEntries((users || []).map((u: { id: string }) => [u.id, u]));
      const results: unknown[] = [];
      for (const session of openSessions || []) {
        const u = byId[session.user_id] as { email?: string; first_name?: string } | undefined;
        if (!u?.email) continue;
        const result = await sendEmail(
          u.email,
          "You are still clocked in",
          `<p>Hi ${u.first_name || "there"},</p><p>You still have an open work session from today (${date}). Please clock out in LC Monitor if you have finished work.</p>`,
        );
        results.push({ user_id: session.user_id, ...result });
      }
      return json({ ok: true, date, count: results.length, results });
    }

    if (type === "daily-summary") {
      const date = yesterdayIst();
      const { data: sessions, error } = await supabase
        .from("work_sessions")
        .select("user_id, total_active_seconds")
        .eq("date", date);
      if (error) throw error;

      const totals: Record<string, number> = {};
      (sessions || []).forEach((s: { user_id: string; total_active_seconds?: number }) => {
        totals[s.user_id] = (totals[s.user_id] || 0) + (s.total_active_seconds || 0);
      });
      const userIds = Object.keys(totals);
      const { data: users } = userIds.length
        ? await supabase.from("users").select("id, email, first_name").in("id", userIds)
        : { data: [] };

      const results: unknown[] = [];
      for (const u of users || []) {
        const hours = formatHours(totals[u.id] || 0);
        const result = await sendEmail(
          u.email,
          `Yesterday's hours — ${date}`,
          `<p>Hi ${u.first_name || "there"},</p><p>You logged <strong>${hours}</strong> of active time on ${date}.</p><p>— LC Monitor</p>`,
        );
        results.push({ user_id: u.id, hours, ...result });
      }
      return json({ ok: true, date, count: results.length, results });
    }

    return json({ error: "Unknown type. Use leave, missed-clock-out, or daily-summary" }, 400);
  } catch (err) {
    console.error("notifications error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
