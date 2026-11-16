// Browser-safe catalogue + brand data for the SARDAR RDX portal (shared by pages and server routes).
import endpointsRaw from "@/data/endpoints.json";

export const UPSTREAM = "https://anabot.my.id";
export const BRAND_KEY = "RDX-API-FREE-191852893";
export const UPSTREAM_KEY = "freeApikey";

export const BRAND = {
  name: "SARDAR RDX",
  tagline: "Powerful REST API Platform — Built for Developers",
  description:
    "Next-generation REST APIs with blazing-fast performance and seamless integration.",
  owner: "SARDAR RDX",
  freeKey: BRAND_KEY,
};

export const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbCU9yi4tRroe2Xhwl24";

export type ParamDefault = string | number | boolean | null | undefined;

export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  default?: ParamDefault;
  placeholder?: string;
  description?: string;
  options?: string[];
}

export interface Endpoint {
  id: string;
  name: string;
  category: string;
  method: string;
  path: string;
  description: string;
  params: EndpointParam[];
}

export interface Category {
  name: string;
  slug: string;
  items: Endpoint[];
  count: number;
  icon: string;
  color1: string;
  color2: string;
}

export function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ICONS: Record<string, string> = {
  AI: "🤖",
  "AI Image": "🎨",
  "AI Video": "🎬",
  "AI Audio": "🎵",
  Search: "🔍",
  Tools: "🛠️",
  Maker: "✨",
  Downloader: "⬇️",
  Games: "🎮",
  Anime: "🌸",
  Drama: "🎭",
  Spotify: "🎧",
  Soundcloud: "🔊",
  "Amazon Music": "🎼",
  Canvas: "🖼️",
  Saweria: "💝",
  "Gopay Merchant": "💳",
  "Order Kuota": "📲",
  "Pluang API": "📈",
  Primbon: "🔮",
  IDN: "📺",
  APIKEY: "🔑",
};

const COLORS: Record<string, [string, string]> = {
  AI: ["#a855f7", "#6366f1"],
  "AI Image": ["#ec4899", "#f43f5e"],
  "AI Video": ["#f97316", "#ef4444"],
  "AI Audio": ["#06b6d4", "#3b82f6"],
  Search: ["#06b6d4", "#0ea5e9"],
  Tools: ["#64748b", "#94a3b8"],
  Maker: ["#facc15", "#f59e0b"],
  Downloader: ["#22c55e", "#10b981"],
  Games: ["#ef4444", "#f43f5e"],
  Anime: ["#ec4899", "#a855f7"],
  Drama: ["#a855f7", "#7c3aed"],
  Spotify: ["#22c55e", "#15803d"],
  Soundcloud: ["#f97316", "#ea580c"],
  "Amazon Music": ["#fbbf24", "#f59e0b"],
  Canvas: ["#ec4899", "#a855f7"],
  Saweria: ["#f43f5e", "#ec4899"],
  "Gopay Merchant": ["#14b8a6", "#0ea5e9"],
  "Order Kuota": ["#3b82f6", "#6366f1"],
  "Pluang API": ["#facc15", "#f97316"],
  Primbon: ["#8b5cf6", "#6366f1"],
  IDN: ["#ef4444", "#dc2626"],
  APIKEY: ["#ff2e3a", "#ff4d57"],
};

export const iconFor = (cat: string) => ICONS[cat] || "⚡";
export const colorFor = (cat: string): [string, string] => COLORS[cat] || ["#ff2e3a", "#ff4d57"];

type RawEndpoint = Partial<Endpoint> & { params?: EndpointParam[] };

export const endpoints: Endpoint[] = (endpointsRaw as unknown as RawEndpoint[])
  .filter((e) => e && e.path)
  .map((e) => ({
    id: String(e.id),
    name: String(e.name || e.id),
    category: e.category || "Other",
    method: e.method || "GET",
    path: String(e.path),
    description: (e.description || "").replace(/^\n+/, "").trim(),
    params: (e.params || []).map((p) => ({
      ...p,
      description: (p.description || "").replace(/^\n+/, "").trim(),
      default: p.default === UPSTREAM_KEY ? BRAND_KEY : p.default,
    })),
  }));

export const endpointById = new Map(endpoints.map((e) => [e.id, e]));
export const endpointByPath = new Map(endpoints.map((e) => [e.path, e]));

export const categories: Category[] = (() => {
  const map = new Map<string, Endpoint[]>();
  for (const e of endpoints) {
    const c = e.category || "Other";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(e);
  }
  const arr = Array.from(map.entries()).map(([name, items]) => {
    const [color1, color2] = colorFor(name);
    return {
      name,
      slug: slugify(name),
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
      icon: iconFor(name),
      color1,
      color2,
    };
  });
  arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr;
})();

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
export const categoryByName = new Map(categories.map((c) => [c.name, c]));

const FEATURED_PATHS = [
  "/api/ai/chat",
  "/api/download/tiktok",
  "/api/maker/brat",
  "/api/ai/image",
  "/api/search/ytSearch",
  "/api/tools/ssweb",
];
export const featured = endpoints.filter((e) => FEATURED_PATHS.includes(e.path)).slice(0, 6);

export function searchEndpoints(query: string) {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? endpoints.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q),
      )
    : endpoints;
  const m = new Map<string, Endpoint[]>();
  for (const e of filtered) {
    const c = e.category || "Other";
    if (!m.has(c)) m.set(c, []);
    m.get(c)!.push(e);
  }
  const grouped = Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  return { grouped, matchCount: filtered.length };
}

/** Value shown in a try-it field, mirroring the original template's `p.default || ''`. */
export function fieldDefault(p: EndpointParam): string {
  return p.default ? String(p.default) : "";
}

/** Query string for the example URL: params with a non-empty default, excluding file/json. */
export function exampleQuery(ep: Endpoint): string {
  return ep.params
    .filter(
      (p) =>
        p.default !== undefined &&
        p.default !== null &&
        p.default !== "" &&
        p.type !== "file" &&
        p.type !== "json",
    )
    .map((p) => encodeURIComponent(p.name) + "=" + encodeURIComponent(String(p.default)))
    .join("&");
}

export function renderSnippet(kind: "curl" | "js" | "py", method: string, url: string) {
  const m = method.toUpperCase();
  if (kind === "curl") return `curl -X ${m} "${url}" \\\n  -H "accept: application/json"`;
  if (kind === "js")
    return `const res = await fetch("${url}", {\n  method: "${m}",\n  headers: { accept: "application/json" }\n});\nconst data = await res.json();\nconsole.log(data);`;
  return `import requests\n\nr = requests.${m.toLowerCase()}(\n    "${url}",\n    headers={"accept": "application/json"},\n)\nprint(r.json())`;
}

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/** Swap upstream attribution fields for the SARDAR RDX brand (top-level only, like the original). */
export function rebrandJson(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    if ("creator" in o) o["creator"] = BRAND.owner;
    if ("owner" in o) o["owner"] = BRAND.owner;
    if ("author" in o) o["author"] = BRAND.owner;
    if ("developer" in o) o["developer"] = BRAND.owner;
    if ("powered_by" in o) o["powered_by"] = BRAND.name;
    if ("source" in o && typeof o["source"] === "string" && o["source"].includes("anabot"))
      o["source"] = BRAND.name;
  }
  return obj;
}

export function swapBrandKey(s: string) {
  return s.includes(BRAND_KEY) ? s.split(BRAND_KEY).join(UPSTREAM_KEY) : s;
}
