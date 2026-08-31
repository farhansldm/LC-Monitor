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

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#0f172a;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5eead4">LC Monitor</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#fff">${esc(title)}</h1>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">This is an automated message from LC Monitor.</p>
  </div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; stubbed: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "";
  if (!to || !to.includes("@")) return { sent: false, stubbed: false, error: "invalid recipient" };
  if (!apiKey) {
    console.log("[notifications stub]", { to, subject });
    return { sent: false, stubbed: true };
  }
  if (!from || /@(example\.(com|org|net)|test\.com)\b/i.test(from)) {
    return { sent: false, stubbed: false, error: "RESEND_FROM must be set to a verified non-placeholder sender address." };
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
    throw new Error(`Resend failed: ${res.status} ${text.slice(0, 200)}`);
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
      const date = esc(body.date || "");
      const comment = typeof body.comment === "string" ? body.comment : "";
      const name = esc(typeof body.name === "string" ? body.name : "there");
      if (!to) return json({ error: "to is required" }, 400);
      const result = await sendEmail(
        to,
        `Leave request ${status.toLowerCase()}`,
        layout(`Leave ${status.toLowerCase()}`, `<p>Hi ${name},</p><p>Your leave request for <strong>${date}</strong> was <strong>${status}</strong>.</p>${comment ? `<p>Comment: ${esc(comment)}</p>` : ""}`),
      );
      return json({ ok: true, ...result });
    }

    if (type === "leave-submitted") {
      const recipients = Array.isArray(body.to)
        ? body.to.filter((x: unknown) => typeof x === "string")
        : typeof body.to === "string" ? [body.to] : [];
      const employee = esc(body.employee_name || "An employee");
      const date = esc(body.date || "");
      const reason = esc(body.reason || "");
      if (recipients.length === 0) return json({ error: "to is required" }, 400);
      const results = [];
      for (const to of [...new Set(recipients)]) {
        results.push(await sendEmail(
          to,
          `Leave request pending — ${employee}`,
          layout("New leave request", `<p><strong>${employee}</strong> submitted leave for <strong>${date}</strong>.</p><p>Reason: ${reason}</p><p>Review it in LC Monitor → Leave Requests.</p>`),
        ));
      }
      return json({ ok: true, count: results.length, results });
    }

    if (type === "welcome") {
      const to = typeof body.to === "string" ? body.to : "";
      const name = esc(body.name || "there");
      const email = esc(body.email || to);
      const password = esc(body.password || "");
      const appUrl = esc(body.app_url || "https://farhan.careerjumpstart.com.au");
      if (!to || !password) return json({ error: "to and password are required" }, 400);
      const result = await sendEmail(
        to,
        "Your LC Monitor account",
        layout("Welcome to LC Monitor", `<p>Hi ${name},</p><p>An administrator created your account.</p>
          <p>Sign in at <a href="${appUrl}" style="color:#5eead4">${appUrl}</a></p>
          <p>Email: <strong>${email}</strong><br/>Temporary password: <strong>${password}</strong></p>
          <p>Change this password after you log in.</p>`),
      );
      return json({ ok: true, ...result });
    }

    if (type === "test") {
      const to = typeof body.to === "string" ? body.to : "";
      if (!to) return json({ error: "to is required" }, 400);
      const result = await sendEmail(
        to,
        "LC Monitor test email",
        layout("Email is working", `<p>This test message was sent from LC Monitor to <strong>${esc(to)}</strong>.</p>`),
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
          layout("Still clocked in", `<p>Hi ${esc(u.first_name || "there")},</p><p>You still have an open work session from today (${esc(date)}). Please clock out in LC Monitor if you have finished work.</p>`),
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
          layout("Daily hours", `<p>Hi ${esc(u.first_name || "there")},</p><p>You logged <strong>${esc(hours)}</strong> of active time on ${esc(date)}.</p>`),
        );
        results.push({ user_id: u.id, hours, ...result });
      }
      return json({ ok: true, date, count: results.length, results });
    }

    return json({ error: "Unknown type. Use leave, leave-submitted, welcome, test, missed-clock-out, or daily-summary" }, 400);
  } catch (err) {
    console.error("notifications error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
