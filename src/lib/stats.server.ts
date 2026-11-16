// Server-only access to the public site counters (request + visitor stats).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface SiteStats {
  total_requests: number;
  today_requests: number;
  total_viewers: number;
}

const EMPTY: SiteStats = { total_requests: 0, today_requests: 0, total_viewers: 0 };

function publicDb() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function toStats(row: unknown): SiteStats {
  const r = (Array.isArray(row) ? row[0] : row) as Partial<Record<keyof SiteStats, unknown>> | undefined;
  if (!r) return EMPTY;
  return {
    total_requests: Number(r.total_requests ?? 0),
    today_requests: Number(r.today_requests ?? 0),
    total_viewers: Number(r.total_viewers ?? 0),
  };
}

export async function getStats(): Promise<SiteStats> {
  try {
    const db = publicDb();
    if (!db) return EMPTY;
    const { data, error } = await db.rpc("get_site_stats");
    if (error) throw error;
    return toStats(data);
  } catch (err) {
    console.error("[stats] get failed", err);
    return EMPTY;
  }
}

export async function bumpViewer(): Promise<SiteStats> {
  try {
    const db = publicDb();
    if (!db) return EMPTY;
    const { data, error } = await db.rpc("bump_site_viewer");
    if (error) throw error;
    return toStats(data);
  } catch (err) {
    console.error("[stats] viewer bump failed", err);
    return EMPTY;
  }
}

export async function bumpRequest(): Promise<void> {
  try {
    const db = publicDb();
    if (!db) return;
    const { error } = await db.rpc("bump_site_request");
    if (error) throw error;
  } catch (err) {
    console.error("[stats] request bump failed", err);
  }
}
