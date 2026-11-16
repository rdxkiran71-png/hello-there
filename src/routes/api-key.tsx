import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/rdx";
import { CopyButton } from "@/components/rdx/CopyButton";

const TITLE = `API Keys — ${BRAND.name}`;
const DESC = `Get the free ${BRAND.name} API key and learn how to authenticate your requests.`;

export const Route = createFileRoute("/api-key")({
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
  component: ApiKeyPage,
});

function ApiKeyPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <main className="container page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> <span>›</span> <span>API Key</span>
      </nav>
      <h1 className="page-title neon-text" data-text="🔑 API Key">
        🔑 API Key
      </h1>
      <p className="muted">Authenticate your requests with an API key.</p>

      <div className="info-card neon-card">
        <h3>Free API Key</h3>
        <p>Use this free shared API key to start testing immediately:</p>
        <div className="key-box">
          <code id="freeKey">{BRAND.freeKey}</code>
          <CopyButton getText={() => BRAND.freeKey}>Copy</CopyButton>
        </div>
        <p className="muted small">The free key has rate limits. For higher quotas, contact {BRAND.name}.</p>
      </div>

      <div className="info-card neon-card">
        <h3>How to use</h3>
        <p>
          Pass <code>apikey</code> as a query parameter on any endpoint:
        </p>
        <pre className="code-block">GET /api/ai/chat?question=Hello&amp;apikey={BRAND.freeKey}</pre>

        <p style={{ marginTop: 16 }}>Or in the request headers:</p>
        <pre className="code-block">{`curl -H "apikey: ${BRAND.freeKey}" \\
  "${origin}/api/ai/chat?question=Hello"`}</pre>
      </div>

      <div className="info-card neon-card">
        <h3>Limits</h3>
        <ul className="limit-list">
          <li>
            <strong>Free tier:</strong> 100 requests / minute
          </li>
          <li>
            <strong>Premium:</strong> 10,000 requests / minute
          </li>
          <li>
            <strong>Enterprise:</strong> Unlimited (custom SLA)
          </li>
        </ul>
      </div>
    </main>
  );
}
