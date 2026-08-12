import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-mock-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
}

function isUUID(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
const VALID_PERIODS = ["today", "week"];
function validatePeriod(v: unknown): string {
  if (typeof v === "string" && VALID_PERIODS.includes(v)) return v;
  return "today";
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, payload, signature] = token.split(".");
    const encoder = new TextEncoder();
    const data = `${header}.${payload}`;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sig = signature.replace(/-/g, "+").replace(/_/g, "/");
    const sigPadded = sig + "=".repeat((4 - (sig.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(sigPadded), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
    if (!valid) return null;
    const payloadStr = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

async function requireAuth(req: Request, jwtSecret: string): Promise<Record<string, unknown> | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  if (!jwtSecret) return null;
  return await verifyJWT(authHeader.replace("Bearer ", ""), jwtSecret);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

/** Client IP from proxy / CDN headers (supports X-Mock-IP for local dev). */
function getClientIp(req: Request): string | null {
  const mock = req.headers.get("x-mock-ip");
  if (mock?.trim()) return mock.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return null;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  if (!range) return false;
  const bits = bitsStr === undefined || bitsStr === "" ? 32 : Number(bitsStr);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const ipNum = ipv4ToInt(ip);
  const rangeNum = ipv4ToInt(range);
  if (ipNum === null || rangeNum === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function classifyLoginType(ip: string | null, ranges: { cidr: string }[]): "WFH" | "SITE" {
  if (!ip) return "WFH";
  // Strip IPv6-mapped IPv4 prefix if present
  const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  for (const r of ranges) {
    if (r.cidr && ipInCidr(normalized, r.cidr.trim())) return "SITE";
  }
  return "WFH";
}

/** Wall-clock time in Asia/Kolkata for shift late/early checks. */
function getIstTimeSeconds(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  return get("hour") * 3600 + get("minute") * 60 + get("second");
}

function timeStringToSeconds(t: string): number {
  const [h = "0", m = "0", s = "0"] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const jwtSecret = Deno.env.get("JWT_SECRET")!;
  const claims = await requireAuth(req, jwtSecret);
  if (!claims) return json({ error: "Unauthorized" }, 401);

  const userId = claims.sub as string;
  const userRole = claims.role as string;
  const userTeamId = claims.team_id as string | null;
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  try {
    // GET /work-sessions/status
    if (action === "status" && req.method === "GET") {
      // Fetch ALL sessions for today (multiple clock-in/out cycles)
      const { data: sessions, error } = await supabase
        .from("work_sessions")
        .select("id, start_time, end_time, total_active_seconds, date, notes, ip_address, login_type, late_flag, early_flag")
        .eq("user_id", userId)
        .eq("date", todayDate())
        .order("start_time", { ascending: true });
      if (error) throw error;

      const allSessions = sessions || [];
      // Active session = the one with no end_time
      const activeSession = allSessions.find((s) => !s.end_time) || null;
      // For backward compat, "session" = active session or last completed
      const currentSession = activeSession || allSessions[allSessions.length - 1] || null;

      // Get today's breaks
      const { data: breaks } = await supabase
        .from("breaks")
        .select("id, break_start, break_end, duration_seconds, session_id")
        .eq("user_id", userId)
        .eq("date", todayDate())
        .order("break_start", { ascending: true });

      const activeBreak = (breaks || []).find((b: { break_end: string | null }) => !b.break_end) || null;
      const totalBreakSeconds = (breaks || []).reduce((sum: number, b: { duration_seconds?: number; break_start: string; break_end: string | null }) => {
        if (b.break_end) return sum + (b.duration_seconds || 0);
        return sum + Math.max(0, Math.floor((Date.now() - new Date(b.break_start).getTime()) / 1000));
      }, 0);

      // Total active seconds across ALL completed sessions
      const totalCompletedSeconds = allSessions
        .filter((s) => s.end_time)
        .reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);

      return json({
        session: currentSession,
        sessions: allSessions,
        is_working: !!activeSession,
        on_break: !!activeBreak,
        active_break: activeBreak,
        breaks: breaks || [],
        total_break_seconds: totalBreakSeconds,
        total_completed_seconds: totalCompletedSeconds,
        session_count: allSessions.length,
      });
    }

    // POST /work-sessions/clock-in
    if (action === "clock-in" && req.method === "POST") {
      const now = new Date();
      const today = todayDate();

      // Close ALL existing open sessions for this user (enforce single active session)
      const { data: openSessions } = await supabase
        .from("work_sessions")
        .select("id, start_time")
        .eq("user_id", userId)
        .is("end_time", null);

      if (openSessions && openSessions.length > 0) {
        for (const os of openSessions) {
          // Close any active breaks on this session
          const { data: activeBreaks } = await supabase
            .from("breaks")
            .select("id, break_start")
            .eq("session_id", os.id)
            .eq("user_id", userId)
            .is("break_end", null);

          if (activeBreaks && activeBreaks.length > 0) {
            for (const ab of activeBreaks) {
              const brkDur = Math.floor((now.getTime() - new Date(ab.break_start).getTime()) / 1000);
              await supabase
                .from("breaks")
                .update({ break_end: now.toISOString(), duration_seconds: Math.max(0, brkDur) })
                .eq("id", ab.id);
            }
          }

          // Calculate total break time for the session
          const { data: allBreaks } = await supabase
            .from("breaks")
            .select("duration_seconds")
            .eq("session_id", os.id);
          const totalBreakSec = (allBreaks || []).reduce((s: number, b: { duration_seconds?: number }) => s + (b.duration_seconds || 0), 0);

          const totalSec = Math.floor((now.getTime() - new Date(os.start_time).getTime()) / 1000);
          const activeSec = Math.max(0, totalSec - totalBreakSec);

          await supabase
            .from("work_sessions")
            .update({ end_time: now.toISOString(), total_active_seconds: activeSec })
            .eq("id", os.id);
        }
      }

      // Capture IP + classify WFH / SITE against trusted office ranges
      const ipAddress = getClientIp(req);
      const { data: officeRanges } = await supabase
        .from("office_ip_ranges")
        .select("cidr");
      const loginType = classifyLoginType(ipAddress, officeRanges || []);

      // Late flag vs assigned shift start (Asia/Kolkata wall clock)
      let lateFlag = false;
      const { data: userShiftRow } = await supabase
        .from("user_shifts")
        .select("shift_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (userShiftRow?.shift_id) {
        const { data: shiftRow } = await supabase
          .from("shifts")
          .select("start_time")
          .eq("id", userShiftRow.shift_id)
          .maybeSingle();
        if (shiftRow?.start_time) {
          lateFlag = getIstTimeSeconds(now) > timeStringToSeconds(String(shiftRow.start_time));
        }
      }

      // Create new session
      const { data: session, error } = await supabase
        .from("work_sessions")
        .insert({
          user_id: userId,
          date: today,
          start_time: now.toISOString(),
          source: "MANUAL",
          ip_address: ipAddress,
          login_type: loginType,
          late_flag: lateFlag,
        })
        .select("id, start_time, end_time, total_active_seconds, date, ip_address, login_type, late_flag, early_flag")
        .single();
      if (error) throw error;
      return json({ session, is_working: true, login_type: loginType, ip_address: ipAddress, late_flag: lateFlag }, 201);
    }

    // POST /work-sessions/clock-out
    if (action === "clock-out" && req.method === "POST") {
      const now = new Date();

      // Find ALL active sessions for this user (end_time IS NULL)
      const { data: openSessions, error: fetchErr } = await supabase
        .from("work_sessions")
        .select("id, start_time")
        .eq("user_id", userId)
        .is("end_time", null);
      if (fetchErr) throw fetchErr;
      if (!openSessions || openSessions.length === 0) {
        return json({ error: "No active session to clock out" }, 400);
      }

      // Early departure vs assigned shift end (Asia/Kolkata wall clock)
      let earlyFlag = false;
      const { data: userShiftOutRow } = await supabase
        .from("user_shifts")
        .select("shift_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (userShiftOutRow?.shift_id) {
        const { data: shiftOutRow } = await supabase
          .from("shifts")
          .select("end_time")
          .eq("id", userShiftOutRow.shift_id)
          .maybeSingle();
        if (shiftOutRow?.end_time) {
          earlyFlag = getIstTimeSeconds(now) < timeStringToSeconds(String(shiftOutRow.end_time));
        }
      }

      const closedSessions = [];

      for (const session of openSessions) {
        // Close any active breaks on this session
        const { data: activeBreaks } = await supabase
          .from("breaks")
          .select("id, break_start")
          .eq("session_id", session.id)
          .eq("user_id", userId)
          .is("break_end", null);

        if (activeBreaks && activeBreaks.length > 0) {
          for (const ab of activeBreaks) {
            const brkDur = Math.floor((now.getTime() - new Date(ab.break_start).getTime()) / 1000);
            await supabase
              .from("breaks")
              .update({ break_end: now.toISOString(), duration_seconds: Math.max(0, brkDur) })
              .eq("id", ab.id);
          }
        }

        // Calculate total break time
        const { data: allBreaks } = await supabase
          .from("breaks")
          .select("duration_seconds")
          .eq("session_id", session.id);
        const totalBreakSec = (allBreaks || []).reduce((s: number, b: { duration_seconds?: number }) => s + (b.duration_seconds || 0), 0);

        const totalSec = Math.floor((now.getTime() - new Date(session.start_time).getTime()) / 1000);
        const activeSec = Math.max(0, totalSec - totalBreakSec);

        const { data: updated, error: updateErr } = await supabase
          .from("work_sessions")
          .update({
            end_time: now.toISOString(),
            total_active_seconds: activeSec,
            early_flag: earlyFlag,
          })
          .eq("id", session.id)
          .select("id, start_time, end_time, total_active_seconds, date, ip_address, login_type, late_flag, early_flag")
          .single();
        if (updateErr) throw updateErr;
        closedSessions.push(updated);
      }

      return json({
        session: closedSessions[0],
        sessions_closed: closedSessions.length,
        is_working: false,
        early_flag: earlyFlag,
      });
    }

    // POST /work-sessions/break-in (start a break)
    if (action === "break-in" && req.method === "POST") {
      const today = todayDate();
      const { data: session } = await supabase
        .from("work_sessions")
        .select("id, end_time")
        .eq("user_id", userId)
        .eq("date", today)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return json({ error: "No active session. Clock in first." }, 400);

      // Check if already on break
      const { data: existingBreak } = await supabase
        .from("breaks")
        .select("id")
        .eq("session_id", session.id)
        .eq("user_id", userId)
        .is("break_end", null)
        .maybeSingle();

      if (existingBreak) return json({ error: "Already on break" }, 409);

      const now = new Date().toISOString();
      const { data: newBreak, error } = await supabase
        .from("breaks")
        .insert({ session_id: session.id, user_id: userId, date: today, break_start: now })
        .select("id, break_start, break_end, duration_seconds")
        .single();
      if (error) throw error;

      return json({ break: newBreak, on_break: true }, 201);
    }

    // POST /work-sessions/break-out (end a break)
    if (action === "break-out" && req.method === "POST") {
      const today = todayDate();
      const { data: session } = await supabase
        .from("work_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return json({ error: "No active session" }, 400);

      const { data: activeBreak } = await supabase
        .from("breaks")
        .select("id, break_start")
        .eq("session_id", session.id)
        .eq("user_id", userId)
        .is("break_end", null)
        .maybeSingle();

      if (!activeBreak) return json({ error: "Not on break" }, 400);

      const now = new Date();
      const durationSeconds = Math.max(0, Math.floor((now.getTime() - new Date(activeBreak.break_start).getTime()) / 1000));

      const { data: updated, error } = await supabase
        .from("breaks")
        .update({ break_end: now.toISOString(), duration_seconds: durationSeconds })
        .eq("id", activeBreak.id)
        .select("id, break_start, break_end, duration_seconds")
        .single();
      if (error) throw error;

      return json({ break: updated, on_break: false });
    }

    // GET /work-sessions/active-now
    if (action === "active-now" && req.method === "GET") {
      const { data, error } = await supabase
        .from("work_sessions")
        .select("id, user_id, start_time, date, ip_address, login_type, late_flag")
        .eq("date", todayDate())
        .is("end_time", null);
      if (error) throw error;

      const userIds = (data || []).map((s) => s.user_id);
      let users: Record<string, { first_name: string; last_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        if (usersData) users = Object.fromEntries(usersData.map((u) => [u.id, u]));
      }

      // Check who's on break
      const sessionIds = (data || []).map((s) => s.id);
      let breakMap: Record<string, boolean> = {};
      if (sessionIds.length > 0) {
        const { data: activeBreaks } = await supabase
          .from("breaks")
          .select("session_id")
          .in("session_id", sessionIds)
          .is("break_end", null);
        (activeBreaks || []).forEach((b: { session_id: string }) => { breakMap[b.session_id] = true; });
      }

      const activeSessions = (data || []).map((s) => ({
        ...s,
        user: users[s.user_id] || null,
        on_break: !!breakMap[s.id],
      }));
      return json({ active_sessions: activeSessions });
    }

    // GET /work-sessions/team-overview
    if (action === "team-overview" && req.method === "GET") {
      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return json({ error: "Forbidden" }, 403);
      }

      const period = validatePeriod(url.searchParams.get("period"));
      const dateFrom = period === "week" ? weekStart() : todayDate();
      const dateTo = todayDate();

      let teamId = userTeamId;
      if (userRole === "ADMIN" && url.searchParams.get("team_id")) {
        const tid = url.searchParams.get("team_id");
        if (tid && isUUID(tid)) teamId = tid;
      }

      if (!teamId) {
        return json({ hasTeam: false, members: [], message: "No team assigned. Ask admin to assign you to a team." });
      }

      const { data: members, error: membersErr } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role, status")
        .eq("team_id", teamId)
        .eq("status", "ACTIVE")
        .order("first_name");
      if (membersErr) throw membersErr;

      if (!members || members.length === 0) {
        return json({ members: [], team_id: teamId });
      }

      const memberIds = members.map((m) => m.id);

      const { data: sessions, error: sessionsErr } = await supabase
        .from("work_sessions")
        .select("id, user_id, date, start_time, end_time, total_active_seconds, ip_address, login_type, late_flag, early_flag")
        .in("user_id", memberIds)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: false });
      if (sessionsErr) throw sessionsErr;

      const sessionsByUser: Record<string, Array<{
        id: string; date: string; start_time: string;
        end_time: string | null; total_active_seconds: number;
        ip_address?: string | null; login_type?: string | null;
        late_flag?: boolean; early_flag?: boolean;
      }>> = {};
      (sessions || []).forEach((s) => {
        if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = [];
        sessionsByUser[s.user_id].push(s);
      });

      const now = Date.now();
      const enrichedMembers = members.map((m) => {
        const userSessions = sessionsByUser[m.id] || [];
        const todaySessions = userSessions.filter((s) => s.date === todayDate());
        const activeToday = todaySessions.find((s) => !s.end_time) || null;
        const todaySession = activeToday
          || [...todaySessions].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]
          || null;

        const isWorking = !!activeToday;

        let todaySeconds = 0;
        if (todaySession) {
          if (todaySession.end_time) {
            todaySeconds = todaySession.total_active_seconds || 0;
          } else {
            todaySeconds = Math.max(0, Math.floor((now - new Date(todaySession.start_time).getTime()) / 1000));
          }
        }

        let periodSeconds = 0;
        userSessions.forEach((s) => {
          if (s.end_time) {
            periodSeconds += (s.total_active_seconds || 0);
          } else {
            periodSeconds += Math.max(0, Math.floor((now - new Date(s.start_time).getTime()) / 1000));
          }
        });

        return {
          ...m,
          is_working: isWorking,
          today_seconds: todaySeconds,
          period_seconds: periodSeconds,
          today_session: todaySession,
          session_count: userSessions.length,
        };
      });

      return json({ members: enrichedMembers, team_id: teamId, period });
    }

    // GET /work-sessions/history?days=14 — list past sessions with notes
    if (action === "history" && req.method === "GET") {
      const daysParam = parseInt(url.searchParams.get("days") || "14", 10);
      const days = Math.min(Math.max(isNaN(daysParam) ? 14 : daysParam, 1), 90);
      const from = new Date();
      from.setDate(from.getDate() - days);
      const fromDate = from.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("work_sessions")
        .select("id, date, start_time, end_time, total_active_seconds, notes")
        .eq("user_id", userId)
        .gte("date", fromDate)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return json({ sessions: data || [] });
    }

    // PATCH /work-sessions/notes — update notes for one of your sessions
    if (action === "notes" && (req.method === "PATCH" || req.method === "POST")) {
      const body = await req.json().catch(() => ({}));
      const sessionId = body?.session_id;
      const notes = body?.notes;
      if (!isUUID(sessionId)) return json({ error: "Invalid session_id" }, 400);
      if (notes !== null && (typeof notes !== "string" || notes.length > 2000)) {
        return json({ error: "Notes must be a string up to 2000 chars" }, 400);
      }
      const { data: existing } = await supabase
        .from("work_sessions")
        .select("id, user_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (!existing || existing.user_id !== userId) return json({ error: "Not found" }, 404);
      const { data, error } = await supabase
        .from("work_sessions")
        .update({ notes: notes?.trim() || null })
        .eq("id", sessionId)
        .select("id, notes")
        .single();
      if (error) throw error;
      return json({ session: data });
    }

    // POST /work-sessions/browser-history — insert browser history records
    if (action === "browser-history" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body) {
        return json({ error: "Missing body" }, 400);
      }

      // Payload can be a single object or an array of history entries
      const entries = Array.isArray(body) ? body : [body];
      if (entries.length === 0) {
        return json({ error: "Empty history payload" }, 400);
      }

      // Resolve domain utility function
      const getDomain = (urlStr: string) => {
        try {
          const u = new URL(urlStr);
          return u.hostname.replace("www.", "");
        } catch {
          return urlStr;
        }
      };

      // Fetch active session if not provided
      let activeSessionId: string | null = null;
      const firstEntryWithoutSession = entries.some(e => !e.session_id || !isUUID(e.session_id));

      if (firstEntryWithoutSession) {
        const { data: activeSession } = await supabase
          .from("work_sessions")
          .select("id")
          .eq("user_id", userId)
          .is("end_time", null)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (activeSession) {
          activeSessionId = activeSession.id;
        }
      }

      // Format entries to insert
      const formattedEntries = entries.map((entry) => {
        const urlStr = typeof entry.url === "string" ? entry.url : "";
        const sId = typeof entry.session_id === "string" && isUUID(entry.session_id)
          ? entry.session_id
          : activeSessionId;
        return {
          user_id: userId,
          url: urlStr,
          domain: getDomain(urlStr),
          title: typeof entry.title === "string" ? entry.title : null,
          duration_seconds: typeof entry.duration_seconds === "number" ? entry.duration_seconds : 0,
          visited_at: typeof entry.visited_at === "string" ? entry.visited_at : new Date().toISOString(),
          session_id: sId,
        };
      });

      const { data, error } = await supabase
        .from("browser_history")
        .insert(formattedEntries)
        .select();

      if (error) throw error;
      return json({ success: true, count: data?.length || 0 }, 201);
    }

    // GET /work-sessions/browser-history — retrieve browser history records
    if (action === "browser-history" && req.method === "GET") {
      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return json({ error: "Forbidden" }, 403);
      }

      const targetUserId = url.searchParams.get("user_id");
      const dateParam = url.searchParams.get("date"); // YYYY-MM-DD

      if (!targetUserId || !isUUID(targetUserId)) {
        return json({ error: "Missing or invalid user_id" }, 400);
      }

      // If user is MANAGER, verify target user belongs to their team
      if (userRole === "MANAGER") {
        if (!userTeamId) {
          return json({ error: "Manager has no assigned team" }, 403);
        }
        const { data: targetUser } = await supabase
          .from("users")
          .select("team_id")
          .eq("id", targetUserId)
          .maybeSingle();

        if (!targetUser || targetUser.team_id !== userTeamId) {
          return json({ error: "Forbidden: User is not on your team" }, 403);
        }
      }

      let query = supabase
        .from("browser_history")
        .select("id, url, domain, title, duration_seconds, visited_at, session_id")
        .eq("user_id", targetUserId)
        .order("visited_at", { ascending: false });

      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        query = query
          .gte("visited_at", `${dateParam}T00:00:00.000Z`)
          .lte("visited_at", `${dateParam}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return json({ history: data || [] });
    }

    // POST /work-sessions/screenshots — receive base64 image from extension,
    // upload to Supabase Storage using service role key (extension JWT is rejected by Storage),
    // then insert the record into the screenshots table.
    if (action === "screenshots" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const imageBase64: string | undefined = body?.image_base64;
      const takenAt: string = body?.taken_at || new Date().toISOString();
      const isBlurred: boolean = body?.is_blurred ?? false;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return json({ error: "Missing image_base64" }, 400);
      }

      // Decode base64 data URL to binary
      // Expected format: data:image/jpeg;base64,<data>
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "").replace(/\s/g, "");
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const filePath = `${userId}/${Date.now()}.jpg`;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Upload to Supabase Storage using service role key
      const storageRes = await fetch(
        `${supabaseUrl}/storage/v1/object/screenshots/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            "Content-Type": "image/jpeg",
          },
          body: bytes,
        }
      );

      if (!storageRes.ok) {
        const errText = await storageRes.text();
        console.error("Storage upload failed:", errText);
        return json({ error: "Storage upload failed", detail: errText }, 500);
      }

      // Insert record into screenshots table
      const { data, error } = await supabase
        .from("screenshots")
        .insert({
          user_id: userId,
          storage_path: filePath,
          taken_at: takenAt,
          is_blurred: isBlurred,
        })
        .select("id, storage_path, taken_at")
        .single();

      if (error) throw error;
      return json({ screenshot: data }, 201);
    }

    // GET /work-sessions/screenshots — retrieve screenshot records for a user & date
    if (action === "screenshots" && req.method === "GET") {
      const targetUserId = url.searchParams.get("user_id") || userId;
      const dateParam = url.searchParams.get("date") || todayDate();

      if (!isUUID(targetUserId)) {
        return json({ error: "Missing or invalid user_id" }, 400);
      }

      // Check access permissions
      if (targetUserId !== userId) {
        if (userRole !== "MANAGER" && userRole !== "ADMIN") {
          return json({ error: "Forbidden" }, 403);
        }

        if (userRole === "MANAGER") {
          if (!userTeamId) {
            return json({ error: "Manager has no assigned team" }, 403);
          }
          const { data: targetUser } = await supabase
            .from("users")
            .select("team_id")
            .eq("id", targetUserId)
            .maybeSingle();

          if (!targetUser || targetUser.team_id !== userTeamId) {
            return json({ error: "Forbidden: User is not on your team" }, 403);
          }
        }
      }

      // Automated retention cleanup: purge DB records & storage files older than 15 days according to date/time
      try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        const { data: oldScreenshots } = await supabase
          .from("screenshots")
          .select("id, storage_path")
          .lt("taken_at", fifteenDaysAgo);

        if (oldScreenshots && oldScreenshots.length > 0) {
          const pathsToRemove = oldScreenshots.map((s) => s.storage_path).filter(Boolean);
          if (pathsToRemove.length > 0) {
            await supabase.storage.from("screenshots").remove(pathsToRemove);
          }
          await supabase.from("screenshots").delete().lt("taken_at", fifteenDaysAgo);
        }
      } catch (cleanupErr) {
        console.error("Screenshot retention cleanup error:", cleanupErr);
      }

      // Query screenshots for target date
      let query = supabase
        .from("screenshots")
        .select("id, user_id, storage_path, taken_at, is_blurred, created_at")
        .eq("user_id", targetUserId)
        .order("taken_at", { ascending: true });

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        query = query
          .gte("taken_at", `${dateParam}T00:00:00.000Z`)
          .lte("taken_at", `${dateParam}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const screenshots = (data || []).map((s) => ({
        ...s,
        public_url: `${supabaseUrl}/storage/v1/object/public/screenshots/${s.storage_path}`,
      }));

      return json({ screenshots });
    }

    // ─── GET /work-sessions/attendance?month=M&year=Y ─────────────────────────
    // Returns the authenticated user's attendance calendar for a given month.
    // Includes active and completed work_sessions and cross-checks
    // the attendance table for explicit LEAVE / HOLIDAY overrides.
    if (action === "attendance" && req.method === "GET") {
      const month = parseInt(url.searchParams.get("month") || "0", 10);
      const year = parseInt(url.searchParams.get("year") || "0", 10);

      if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
        return json({ error: "Invalid or missing month/year parameters" }, 400);
      }

      // Build date range for the requested month (UTC)
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDayDate = new Date(Date.UTC(year, month, 0)); // last day of month
      const lastDay = lastDayDate.toISOString().slice(0, 10);

      // Fetch all work sessions for this month (including active ones where end_time is null)
      const { data: sessions, error: sessErr } = await supabase
        .from("work_sessions")
        .select("date, start_time, end_time, total_active_seconds")
        .eq("user_id", userId)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: true });
      if (sessErr) throw sessErr;

      // Fetch explicit attendance overrides (LEAVE, HOLIDAY, etc.)
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("date, status, total_work_seconds, notes")
        .eq("user_id", userId)
        .gte("date", firstDay)
        .lte("date", lastDay);
      if (attErr) throw attErr;

      // Build lookup maps
      const nowTs = Date.now();
      const sessionMap: Record<string, { start_time: string; end_time?: string; total_active_seconds: number }> = {};
      for (const s of sessions || []) {
        const activeSec = s.end_time
          ? (s.total_active_seconds || 0)
          : Math.max(0, Math.floor((nowTs - new Date(s.start_time).getTime()) / 1000));

        if (!sessionMap[s.date]) {
          sessionMap[s.date] = {
            start_time: s.start_time,
            end_time: s.end_time || undefined,
            total_active_seconds: activeSec,
          };
        } else {
          sessionMap[s.date].total_active_seconds += activeSec;
          if (s.end_time) sessionMap[s.date].end_time = s.end_time;
        }
      }

      const attMap: Record<string, { status: string; total_work_seconds: number; notes: string | null }> = {};
      for (const a of attRows || []) {
        attMap[a.date] = a;
      }

      // Determine which days of this month are weekends (Sat=6, Sun=0)
      const daysInMonth = lastDayDate.getUTCDate();
      const todayStr = todayDate();
      const records: unknown[] = [];

      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0;
      let workingDays = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dow = new Date(`${dateStr}T12:00:00Z`).getUTCDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        const isFuture = dateStr > todayStr;

        let status: string;
        let clock_in: string | undefined;
        let clock_out: string | undefined;
        let total_hours: number | undefined;

        if (isWeekend) {
          status = "WEEKEND";
        } else if (isFuture) {
          status = "FUTURE";
        } else {
          workingDays++;
          const override = attMap[dateStr];
          if (override && override.status !== "PRESENT") {
            // Explicit override wins (LEAVE / HOLIDAY)
            status = override.status;
            if (override.status === "LEAVE") leaveCount++;
            if (override.status === "HOLIDAY") holidayCount++;
          } else {
            const sess = sessionMap[dateStr];
            if (sess) {
              status = "PRESENT";
              presentCount++;
              clock_in = sess.start_time;
              clock_out = sess.end_time;
              total_hours = Math.round((sess.total_active_seconds / 3600) * 100) / 100;
            } else {
              status = "ABSENT";
              absentCount++;
            }
          }
        }

        records.push({ date: dateStr, status, clock_in, clock_out, total_hours });
      }

      return json({
        month,
        year,
        records,
        summary: {
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          holiday: holidayCount,
          total_working_days: workingDays,
        },
      });
    }

    // ─── GET /work-sessions/attendance/corrections/mine ───────────────────────
    // Returns the authenticated employee's own submitted correction requests.
    if (action === "mine" && pathParts.includes("corrections") && req.method === "GET") {
      const { data, error } = await supabase
        .from("attendance_corrections")
        .select("id, user_id, date, reason, status, reviewer_id, reviewed_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(data || []);
    }

    // ─── GET /work-sessions/attendance/corrections/all ────────────────────────
    // MANAGER / ADMIN only: all correction requests with employee names joined.
    if (action === "all" && pathParts.includes("corrections") && req.method === "GET") {
      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return json({ error: "Forbidden" }, 403);
      }

      const { data, error } = await supabase
        .from("attendance_corrections")
        .select(`
          id, user_id, date, reason, status, reviewer_id, reviewed_at, created_at,
          users:user_id (first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Flatten joined user fields safely (handling both single object or array return from Supabase)
      const corrections = (data || []).map((c: Record<string, unknown>) => {
        const uRaw = c.users;
        const u = Array.isArray(uRaw) ? uRaw[0] : (uRaw as { first_name?: string; last_name?: string; email?: string } | null);
        return {
          id: c.id,
          user_id: c.user_id,
          date: c.date,
          reason: c.reason,
          status: c.status,
          reviewer_id: c.reviewer_id,
          reviewed_at: c.reviewed_at,
          created_at: c.created_at,
          employee_name: u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : null,
          employee_email: u?.email ?? null,
        };
      });

      return json(corrections);
    }

    // ─── POST /work-sessions/attendance/corrections ───────────────────────────
    // Employee submits a new attendance correction request.
    if (action === "corrections" && pathParts.includes("attendance") && req.method === "POST") {
      let body: { date?: string; reason?: string } = {};
      try { body = await req.json(); } catch { /* ignore */ }

      const { date, reason } = body;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return json({ error: "Missing or invalid 'date' (YYYY-MM-DD)" }, 400);
      }
      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return json({ error: "Missing or empty 'reason'" }, 400);
      }
      if (date > todayDate()) {
        return json({ error: "Cannot submit correction for a future date" }, 400);
      }

      // Look up existing attendance record for that date to get original times
      const { data: existingSession } = await supabase
        .from("work_sessions")
        .select("start_time, end_time")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      const { data: correction, error } = await supabase
        .from("attendance_corrections")
        .insert({
          user_id: userId,
          date,
          reason: reason.trim().slice(0, 500),
          original_in: existingSession?.start_time ?? null,
          original_out: existingSession?.end_time ?? null,
          requested_in: existingSession?.start_time ?? null,
          requested_out: existingSession?.end_time ?? null,
          status: "PENDING",
        })
        .select("id, user_id, date, reason, status, created_at")
        .single();
      if (error) throw error;

      return json({ correction }, 201);
    }

    // ─── PATCH /work-sessions/attendance/corrections/:id/review ──────────────
    // MANAGER / ADMIN only: approve or reject a correction.
    if (action === "review" && pathParts.includes("corrections") && req.method === "PATCH") {
      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return json({ error: "Forbidden" }, 403);
      }

      // Extract correction id — it's the segment before "review"
      const correctionIdx = pathParts.indexOf("review") - 1;
      const correctionId = correctionIdx >= 0 ? pathParts[correctionIdx] : null;

      if (!correctionId || !isUUID(correctionId)) {
        return json({ error: "Missing or invalid correction id" }, 400);
      }

      let body: { action?: string } = {};
      try { body = await req.json(); } catch { /* ignore */ }

      const reviewAction = body.action;
      if (reviewAction !== "APPROVED" && reviewAction !== "REJECTED") {
        return json({ error: "action must be APPROVED or REJECTED" }, 400);
      }

      // Fetch the correction to verify it exists and is PENDING
      const { data: existing, error: fetchErr } = await supabase
        .from("attendance_corrections")
        .select("id, status, user_id, date")
        .eq("id", correctionId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!existing) return json({ error: "Correction not found" }, 404);
      if (existing.status !== "PENDING") {
        return json({ error: "Correction has already been reviewed" }, 409);
      }

      // If manager (not admin), restrict to own team
      if (userRole === "MANAGER" && userTeamId) {
        const { data: empRow } = await supabase
          .from("users")
          .select("team_id")
          .eq("id", existing.user_id)
          .maybeSingle();
        if (!empRow || empRow.team_id !== userTeamId) {
          return json({ error: "Forbidden: Employee is not on your team" }, 403);
        }
      }

      // Update correction status
      const { data: updated, error: updateErr } = await supabase
        .from("attendance_corrections")
        .update({
          status: reviewAction,
          reviewer_id: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", correctionId)
        .select("id, user_id, date, reason, status, reviewer_id, reviewed_at, created_at")
        .single();
      if (updateErr) throw updateErr;

      // If APPROVED, upsert an attendance record so the calendar shows PRESENT
      if (reviewAction === "APPROVED") {
        await supabase
          .from("attendance")
          .upsert(
            {
              user_id: existing.user_id,
              date: existing.date,
              status: "PRESENT",
              total_work_seconds: 0,
            },
            { onConflict: "user_id,date" }
          );
      }

      return json({ correction: updated });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("Work sessions error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});