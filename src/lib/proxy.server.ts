// Reverse proxy for /api/* → upstream provider, with retries, brand-key swap and JSON rebranding.
import {
  BRAND,
  BRAND_KEY,
  UPSTREAM,
  UPSTREAM_KEY,
  categories,
  endpointByPath,
  endpoints,
  rebrandJson,
  swapBrandKey,
} from "@/lib/rdx";
import { bumpRequest, getStats } from "@/lib/stats.server";

// Some upstream generators (video, quote images, AI search) legitimately take 50-90s.
const UPSTREAM_TIMEOUT_MS = 150000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, apikey, Authorization",
  "Access-Control-Expose-Headers": "Content-Disposition, X-Upstream-Status, X-Proxy-Attempts",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "X-Powered-By": BRAND.name, ...CORS_HEADERS },
  });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" } });
}

const isTimeout = (err: unknown) =>
  err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");

export function apiManifest() {
  return json({
    success: true,
    brand: BRAND.name,
    total_endpoints: endpoints.length,
    total_categories: categories.length,
    docs: "/docs",
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c.count })),
  });
}

export async function apiStats() {
  const s = await getStats();
  return new Response(
    JSON.stringify({
      success: true,
      ...s,
      total_endpoints: endpoints.length,
      total_categories: categories.length,
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Powered-By": BRAND.name,
        ...CORS_HEADERS,
      },
    },
  );
}

async function buildBody(request: Request): Promise<BodyInit | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const o = body as Record<string, unknown>;
      for (const k of Object.keys(o)) if (o[k] === BRAND_KEY) o[k] = UPSTREAM_KEY;
    }
    return JSON.stringify(body ?? {});
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await request.text());
    for (const [k, v] of Array.from(params.entries())) if (v === BRAND_KEY) params.set(k, UPSTREAM_KEY);
    return params.toString();
  }
  if (ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    const out = new FormData();
    for (const [k, v] of fd.entries()) out.append(k, v === BRAND_KEY ? UPSTREAM_KEY : v);
    return out;
  }
  const buf = await request.arrayBuffer();
  return buf.byteLength ? buf : undefined;
}

export async function proxyToUpstream(request: Request, splat: string) {
  const reqUrl = new URL(request.url);
  const fullPath = "/api/" + splat.replace(/^\/+/, "");

  if (fullPath === "/api/_stats") return apiStats();

  const ep = endpointByPath.get(fullPath);
  if (!ep) {
    return json({ success: false, brand: BRAND.name, error: "Endpoint not found", path: fullPath }, 404);
  }

  const upstreamUrl = UPSTREAM + swapBrandKey(fullPath + reqUrl.search);
  const body = await buildBody(request);
  // Count the request in parallel with the upstream call.
  const counted = bumpRequest();

  const headers: Record<string, string> = {
    Accept: request.headers.get("accept") || "application/json",
    "Accept-Language": request.headers.get("accept-language") || "en-US,en;q=0.9",
    "User-Agent": BRAND.name + " API Portal",
  };
  const apikeyHeader = request.headers.get("apikey");
  if (apikeyHeader) headers["apikey"] = swapBrandKey(apikeyHeader);
  const ct = request.headers.get("content-type");
  // FormData bodies set their own multipart boundary.
  if (ct && body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = ct;

  const init: RequestInit = { method: request.method, headers };
  if (body !== undefined) init.body = body;

  let upstream: Response | undefined;
  let lastErr: unknown;
  let attempts = 0;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    attempts = i + 1;
    try {
      upstream = await fetchWithTimeout(upstreamUrl, init, UPSTREAM_TIMEOUT_MS);
      const transient = upstream.status === 429 || (upstream.status >= 502 && upstream.status <= 524);
      const flaky500 = upstream.status === 500 && i < 1;
      if (!transient && !flaky500) break;
      if (i < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, i));
        continue;
      }
      break;
    } catch (err) {
      lastErr = err;
      upstream = undefined;
      // A timed-out generation would only be restarted from scratch; give up instead.
      if (isTimeout(err)) break;
      if (i < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, i));
        continue;
      }
    }
  }

  await counted;

  if (!upstream) {
    if (isTimeout(lastErr)) {
      return json(
        {
          success: false,
          brand: BRAND.name,
          error: "Upstream timed out",
          message: `No response from the provider after ${UPSTREAM_TIMEOUT_MS / 1000}s`,
          attempts,
        },
        504,
      );
    }
    return json(
      {
        success: false,
        brand: BRAND.name,
        error: "Upstream request failed",
        message: lastErr instanceof Error ? lastErr.message : "Unknown error",
        attempts,
      },
      502,
    );
  }

  try {
    const upstreamCt = upstream.headers.get("content-type") || "application/octet-stream";
    const outHeaders = new Headers({
      "Content-Type": upstreamCt,
      "X-Powered-By": BRAND.name,
      "X-Upstream-Status": String(upstream.status),
      "X-Proxy-Attempts": String(attempts),
      ...CORS_HEADERS,
    });
    const cd = upstream.headers.get("content-disposition");
    if (cd) outHeaders.set("Content-Disposition", cd);

    if (upstreamCt.includes("application/json")) {
      const text = await upstream.text();
      try {
        const obj = JSON.parse(text);
        return new Response(JSON.stringify(rebrandJson(obj)), { status: upstream.status, headers: outHeaders });
      } catch {
        return new Response(text, { status: upstream.status, headers: outHeaders });
      }
    }
    // Stream binary/media straight through (some responses are 40MB+).
    const cl = upstream.headers.get("content-length");
    if (cl) outHeaders.set("Content-Length", cl);
    return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (err) {
    return json(
      {
        success: false,
        brand: BRAND.name,
        error: "Failed to read upstream response",
        message: err instanceof Error ? err.message : String(err),
        attempts,
      },
      502,
    );
  }
}
