import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BRAND,
  WHATSAPP_CHANNEL,
  categoryByName,
  endpointById,
  exampleQuery,
  fieldDefault,
  renderSnippet,
  type Endpoint,
  type EndpointParam,
} from "@/lib/rdx";
import { MethodBadge, colorVars } from "@/components/rdx/ApiCard";
import { CopyButton } from "@/components/rdx/CopyButton";
import { ErrorState } from "@/components/rdx/SiteChrome";

export const Route = createFileRoute("/endpoint/$id")({
  loader: ({ params }) => {
    const ep = endpointById.get(params.id);
    if (!ep) throw notFound();
    return { id: ep.id };
  },
  head: ({ loaderData }) => {
    const ep = loaderData ? endpointById.get(loaderData.id) : undefined;
    const title = ep ? `${ep.name} — ${BRAND.name}` : `Not Found — ${BRAND.name}`;
    const desc = ep
      ? ep.description || `${ep.method} ${ep.path} — docs and live try-it on ${BRAND.name}.`
      : "Endpoint not found.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => <ErrorState title="Not Found" message="Endpoint not found." />,
  component: EndpointPage,
});

type Tab = "curl" | "js" | "py";
type Media = { type: "image" | "audio" | "video"; url: string };
type Result = {
  loading: boolean;
  status: string;
  ok: boolean;
  time: string;
  body: string;
  media: Media[];
  url: string;
};

const defaultsFor = (ep: Endpoint) =>
  Object.fromEntries(ep.params.filter((p) => p.type !== "file").map((p) => [p.name, fieldDefault(p)]));

function walk(node: unknown, fn: (v: unknown) => void, seen = new WeakSet<object>()) {
  if (node === null || node === undefined) return;
  if (typeof node === "object") {
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) node.forEach((v) => walk(v, fn, seen));
    else Object.values(node as Record<string, unknown>).forEach((v) => walk(v, fn, seen));
  } else fn(node);
}

function mediaFromJson(data: unknown): Media[] {
  const found: Media[] = [];
  walk(data, (value) => {
    if (typeof value === "string" && /^https?:\/\//i.test(value) && value.length < 2000) {
      const lower = (value.split("?")[0] ?? "").toLowerCase();
      if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) found.push({ type: "image", url: value });
      else if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower)) found.push({ type: "audio", url: value });
      else if (/\.(mp4|webm|mov|mkv)$/.test(lower)) found.push({ type: "video", url: value });
    }
  });
  return found.slice(0, 4);
}

function EndpointPage() {
  const { id } = Route.useLoaderData();
  const ep = endpointById.get(id)!;
  return <EndpointView key={ep.id} ep={ep} />;
}

function EndpointView({ ep }: { ep: Endpoint }) {
  const c = categoryByName.get(ep.category);
  const c1 = c ? c.color1 : "#ff2e3a";
  const c2 = c ? c.color2 : "#ff4d57";
  const method = (ep.method || "GET").toUpperCase();
  // "GET/POST" endpoints are executed as GET from the try-it form.
  const execMethod = method.includes("/") ? "GET" : method;

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const [values, setValues] = useState<Record<string, string>>(() => defaultsFor(ep));
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [tab, setTab] = useState<Tab>("curl");
  const [result, setResult] = useState<Result | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      blobUrls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const initialExampleUrl = origin + ep.path + (exampleQuery(ep) ? "?" + exampleQuery(ep) : "");

  const liveUrl = useMemo(() => {
    const qs = new URLSearchParams();
    for (const p of ep.params) {
      if (p.type === "file") {
        const f = files[p.name];
        if (f) qs.append(p.name, "@" + f.name);
      } else {
        const v = values[p.name] ?? "";
        if (v !== "") qs.append(p.name, v);
      }
    }
    const q = qs.toString();
    return origin + ep.path + (q ? "?" + q : "");
  }, [ep, values, files, origin]);

  const snippetUrl = origin ? liveUrl : initialExampleUrl;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const qs = new URLSearchParams();
    const bodyData: Record<string, string> = {};
    const fd = new FormData();
    let hasFile = false;
    for (const p of ep.params) {
      if (p.type === "file") {
        const f = files[p.name];
        if (f) {
          hasFile = true;
          fd.append(p.name, f);
        }
      } else {
        const v = values[p.name] ?? "";
        if (v !== "") {
          qs.append(p.name, v);
          bodyData[p.name] = v;
        }
      }
    }
    const url = ep.path + (qs.toString() ? "?" + qs.toString() : "");
    const fullUrl = window.location.origin + url;
    setResult({ loading: true, status: "⏳ Loading…", ok: true, time: "", body: "", media: [], url: fullUrl });

    const init: RequestInit = { method: execMethod, headers: { Accept: "application/json" } };
    if (execMethod !== "GET" && execMethod !== "HEAD") {
      if (hasFile) {
        for (const [k, v] of Object.entries(bodyData)) if (!fd.has(k)) fd.append(k, v);
        init.body = fd;
      } else {
        init.headers = { Accept: "application/json", "Content-Type": "application/json" };
        init.body = JSON.stringify(bodyData);
      }
    }

    const t0 = performance.now();
    try {
      const res = await fetch(url, init);
      const elapsed = (performance.now() - t0).toFixed(0);
      const ct = res.headers.get("content-type") || "";
      const base = {
        loading: false,
        status: (res.ok ? "✓ " : "✗ ") + res.status + " " + res.statusText,
        ok: res.ok,
        time: elapsed + " ms · " + (ct.split(";")[0] ?? ""),
        url: fullUrl,
      };
      if (ct.includes("application/json")) {
        const data = await res.json();
        setResult({ ...base, body: JSON.stringify(data, null, 2), media: mediaFromJson(data) });
      } else if (ct.includes("image/") || ct.includes("audio/") || ct.includes("video/")) {
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        blobUrls.current.push(u);
        const type: Media["type"] = ct.includes("image/") ? "image" : ct.includes("audio/") ? "audio" : "video";
        setResult({
          ...base,
          body: type === "image" ? `[image binary, ${blob.size} bytes]` : `[${ct}, ${blob.size} bytes]`,
          media: [{ type, url: u }],
        });
      } else {
        setResult({ ...base, body: await res.text(), media: [] });
      }
    } catch (err) {
      setResult({
        loading: false,
        status: "✗ Error",
        ok: false,
        time: "",
        body: err instanceof Error ? err.message : String(err),
        media: [],
        url: fullUrl,
      });
    }
  };

  const setVal = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <main className="container page endpoint-page">
      {c ? (
        <Link className="back-link" to="/category/$slug" params={{ slug: c.slug }}>
          ← Back
        </Link>
      ) : (
        <Link className="back-link" to="/docs">
          ← Back
        </Link>
      )}

      <div className="endpoint-header" style={colorVars(c1, c2)}>
        <div className="endpoint-title-row">
          <h1 className="page-title">{ep.name}</h1>
          <span className="api-cat large" style={colorVars(c1, c2)}>
            {ep.category}
          </span>
        </div>
        {ep.description ? <p className="endpoint-description">{ep.description}</p> : null}
      </div>

      <a className="join-banner" href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer">
        <span className="join-banner-icon">👋</span>
        <span className="join-banner-text">Join WhatsApp Channel for Updates</span>
      </a>

      <section className="doc-section">
        <h2 className="doc-section-title">Documentation</h2>
        <div className="doc-line">
          <span className="doc-line-label">Method</span>
          <MethodBadge method={method} />
          <span className="doc-line-sep">—</span>
          <code className="doc-line-path">{ep.path}</code>
          <CopyButton className="copy-btn small" getText={() => window.location.origin + ep.path}>
            📋 Copy
          </CopyButton>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">Parameters</h2>
        {ep.params.length === 0 ? (
          <p className="muted">This endpoint accepts no parameters.</p>
        ) : (
          <ul className="params-list">
            {ep.params.map((p) => (
              <ParamItem key={p.name} p={p} />
            ))}
          </ul>
        )}
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">Example Request</h2>
        <div className="example-block">
          <div className="example-tabs">
            {(
              [
                ["curl", "cURL"],
                ["js", "JavaScript"],
                ["py", "Python"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={"tab-btn" + (tab === k ? " active" : "")}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
            <CopyButton
              className="copy-btn small example-copy-btn"
              getText={() => renderSnippet(tab, method, snippetUrl)}
            >
              📋 Copy
            </CopyButton>
          </div>
          <pre className="code-block">{renderSnippet(tab, method, snippetUrl)}</pre>
        </div>
        <button
          type="button"
          className="btn btn-primary execute-top-btn"
          onClick={() => {
            formRef.current?.requestSubmit();
            setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          }}
        >
          ▶ Execute
        </button>
      </section>

      <section className="doc-section">
        <h2 className="doc-section-title">Try it</h2>

        <div className="request-preview">
          <div className="request-preview-head">
            <MethodBadge method={method} />
            <span className="request-preview-label">Request URL</span>
            <CopyButton className="copy-btn small" getText={() => liveUrl}>
              📋 Copy
            </CopyButton>
          </div>
          <code className="request-preview-url">{snippetUrl}</code>
        </div>

        <form className="try-form" ref={formRef} onSubmit={submit}>
          {ep.params.map((p) => (
            <div className="form-row" key={p.name}>
              <label>
                <span className="form-label">
                  {p.name}
                  {p.required ? <span className="required-tag">*</span> : null}
                </span>
                <ParamField
                  p={p}
                  value={values[p.name] ?? ""}
                  onChange={(v) => setVal(p.name, v)}
                  onFile={(f) => setFiles((s) => ({ ...s, [p.name]: f }))}
                />
                {p.description ? <small className="form-hint">{p.description}</small> : null}
              </label>
            </div>
          ))}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              ▶ Execute
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setValues(defaultsFor(ep))}>
              ↻ Reset
            </button>
          </div>
        </form>

        <div ref={responseRef} className={"response-box" + (result ? "" : " hidden")}>
          {result ? (
            <>
              <div className="response-head">
                <span
                  style={{
                    color: result.loading ? "var(--text-muted)" : result.ok ? "var(--green)" : "#f87171",
                  }}
                >
                  {result.status}
                </span>
                <span>{result.time}</span>
              </div>
              <div className="response-url-row">
                <span className="response-url-label">URL:</span>
                <code className="response-url">{result.url}</code>
                <CopyButton className="copy-btn small" getText={() => result.url}>
                  📋 Copy URL
                </CopyButton>
              </div>
              <div className="response-body-wrap">
                <CopyButton className="copy-btn small response-copy-btn" getText={() => result.body}>
                  📋 Copy Response
                </CopyButton>
                <pre>{result.body}</pre>
              </div>
              <div>
                {result.media.map((m, i) =>
                  m.type === "image" ? (
                    <img key={i} src={m.url} loading="lazy" alt="" />
                  ) : m.type === "audio" ? (
                    <audio key={i} controls src={m.url} />
                  ) : (
                    <video key={i} controls src={m.url} />
                  ),
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ParamItem({ p }: { p: EndpointParam }) {
  const showDefault = p.default !== undefined && p.default !== null && p.default !== "" && p.type !== "file";
  return (
    <li className="params-list-item">
      <code className="params-list-name">{p.name}</code>
      {p.description ? (
        <>
          <span className="params-list-sep"> - </span>
          <span className="params-list-desc">{p.description}</span>
        </>
      ) : null}
      <span className="params-list-meta">
        {" "}({p.required ? "Required" : "Optional"}){" "}
        {showDefault ? (
          <span className="params-list-default">
            [Default: <code>{typeof p.default === "string" ? p.default : JSON.stringify(p.default)}</code>]
          </span>
        ) : null}
        {p.options && p.options.length ? (
          <span className="params-list-default">
            {" "}[Options:{" "}
            {p.options.map((opt, i) => (
              <span key={opt}>
                <code>{opt}</code>
                {i < p.options!.length - 1 ? ", " : ""}
              </span>
            ))}
            ]
          </span>
        ) : null}
      </span>
    </li>
  );
}

function ParamField({
  p,
  value,
  onChange,
  onFile,
}: {
  p: EndpointParam;
  value: string;
  onChange: (v: string) => void;
  onFile: (f: File | undefined) => void;
}) {
  if (p.type === "select" && p.options) {
    return (
      <select name={p.name} value={value} onChange={(e) => onChange(e.target.value)}>
        {p.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (p.type === "textarea" || p.type === "json") {
    return (
      <textarea
        name={p.name}
        rows={3}
        placeholder={p.placeholder || ""}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (p.type === "file") {
    return <input type="file" name={p.name} onChange={(e) => onFile(e.target.files?.[0])} />;
  }
  if (p.type === "number") {
    return (
      <input
        type="number"
        name={p.name}
        value={value}
        placeholder={p.placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type="text"
      name={p.name}
      value={value}
      placeholder={p.placeholder || p.name}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
