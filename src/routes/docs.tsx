import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND, categories, categoryByName, endpoints, searchEndpoints } from "@/lib/rdx";
import { MethodBadge, colorVars } from "@/components/rdx/ApiCard";

const TITLE = `API Documentation — ${BRAND.name}`;
const DESC = `Browse and search ${endpoints.length} REST API endpoints across ${categories.length} categories.`;

export const Route = createFileRoute("/docs")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => {
    const q = typeof s["q"] === "string" ? s["q"] : "";
    return q ? { q } : {};
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Docs,
});

function Docs() {
  const { q = "" } = Route.useSearch();
  const query = q.toLowerCase().trim();
  const navigate = useNavigate();
  const [input, setInput] = useState(query);
  useEffect(() => setInput(query), [query]);
  const { grouped, matchCount } = searchEndpoints(query);

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1 className="page-title">API Documentation</h1>
          <p className="muted">
            {endpoints.length} endpoints across {categories.length} categories
          </p>
        </div>
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            navigate({ to: "/docs", search: v ? { q: v } : {} });
          }}
        >
          <input
            type="search"
            name="q"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="🔍 Search endpoints, categories, descriptions…"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {query ? (
        <p className="muted" style={{ marginBottom: 24 }}>
          <strong>{matchCount}</strong> result{matchCount === 1 ? "" : "s"} for "{query}" ·{" "}
          <Link to="/docs">Clear search</Link>
        </p>
      ) : null}

      {grouped.length === 0 ? (
        <div className="empty-state">
          <h3>No endpoints match your search.</h3>
          <p>
            <Link to="/docs">Browse all endpoints</Link>
          </p>
        </div>
      ) : null}

      {grouped.map(([catName, items]) => {
        const c = categoryByName.get(catName);
        const c1 = c ? c.color1 : "#ff2e3a";
        const c2 = c ? c.color2 : "#ff4d57";
        return (
          <section key={catName} className="cat-section reveal" id={`cat-${c ? c.slug : ""}`} style={colorVars(c1, c2)}>
            <div className="cat-section-head">
              <div className="cat-icon-small">{c ? c.icon : "⚡"}</div>
              <h2>{catName}</h2>
              <span className="cat-count">{items.length}</span>
              {c ? (
                <Link to="/category/$slug" params={{ slug: c.slug }} className="cat-jump">
                  View all →
                </Link>
              ) : null}
            </div>
            <div className="endpoint-list">
              {items.map((e) => (
                <Link
                  key={e.id}
                  to="/endpoint/$id"
                  params={{ id: e.id }}
                  className="endpoint-row"
                  style={colorVars(c1, c2)}
                >
                  <MethodBadge method={e.method || "GET"} />
                  <code className="ep-path">{e.path}</code>
                  <span className="ep-name">{e.name}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
