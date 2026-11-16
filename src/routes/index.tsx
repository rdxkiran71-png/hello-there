import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND, categories, endpoints, featured } from "@/lib/rdx";
import { recordHomeVisit } from "@/lib/stats.functions";
import { CountUp } from "@/components/rdx/CountUp";
import { ApiCard, colorVars } from "@/components/rdx/ApiCard";

type SiteStats = { total_requests: number; today_requests: number; total_viewers: number };
const EMPTY_STATS: SiteStats = { total_requests: 0, today_requests: 0, total_viewers: 0 };

const TITLE = `${BRAND.name} — ${BRAND.tagline}`;

export const Route = createFileRoute("/")({
  loader: async (): Promise<SiteStats> => {
    try {
      return (await recordHomeVisit()) ?? EMPTY_STATS;
    } catch {
      return EMPTY_STATS;
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: BRAND.description },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: BRAND.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const loaded = Route.useLoaderData() as SiteStats | undefined;
  const [stats, setStats] = useState<SiteStats>(() => loaded ?? EMPTY_STATS);

  useEffect(() => {
    if (loaded) setStats(loaded);
  }, [loaded]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/_stats", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (data?.success)
          setStats({
            total_requests: Number(data.total_requests) || 0,
            today_requests: Number(data.today_requests) || 0,
            total_viewers: Number(data.total_viewers) || 0,
          });
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <main>
      <section className="hero">
        <svg className="floating-shape shape-1" width="44" height="44" viewBox="0 0 44 44">
          <polygon points="22,3 41,41 3,41" fill="none" stroke="#00f0ff" strokeWidth="2" />
        </svg>
        <svg className="floating-shape shape-2" width="38" height="38" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="16" fill="none" stroke="#ff00d4" strokeWidth="2" />
        </svg>
        <svg className="floating-shape shape-3" width="40" height="40" viewBox="0 0 40 40">
          <rect x="4" y="4" width="32" height="32" fill="none" stroke="#b347ff" strokeWidth="2" rx="4" />
        </svg>
        <svg className="floating-shape shape-4" width="36" height="36" viewBox="0 0 36 36">
          <polygon points="18,2 34,18 18,34 2,18" fill="none" stroke="#ffe600" strokeWidth="2" />
        </svg>

        <div className="container hero-inner">
          <span className="badge">▸ VIP API Platform • v2.0</span>
          <h1 className="hero-title">
            <span className="neon-text-3d">{BRAND.name}</span>
            <span className="hero-subtitle">REST API Platform</span>
          </h1>
          <p className="hero-tagline">{BRAND.tagline}</p>
          <p className="hero-description">{BRAND.description}</p>

          <div className="stats-grid">
            <div className="stat-card primary has-corners">
              <div className="stat-icon">📊</div>
              <div>
                <CountUp value={stats.total_requests} />
                <p>Total Requests</p>
              </div>
            </div>
            <div className="stat-card secondary has-corners">
              <div className="stat-icon">⚡</div>
              <div>
                <CountUp value={stats.today_requests} />
                <p>Requests Today</p>
              </div>
            </div>
            <div className="stat-card tertiary has-corners">
              <div className="stat-icon">🧩</div>
              <div>
                <CountUp value={endpoints.length} />
                <p>API Endpoints</p>
              </div>
            </div>
            <div className="stat-card quaternary has-corners">
              <div className="stat-icon">📚</div>
              <div>
                <CountUp value={categories.length} />
                <p>Categories</p>
              </div>
            </div>
          </div>

          <div className="hero-cta">
            <Link to="/docs" className="btn btn-primary">
              <span>▸ Explore Documentation</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/api-key" className="btn btn-ghost">
              <span>🔑 Get API Key</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">▸ Featured</span>
            <h2 className="section-title">Most Popular APIs</h2>
            <p className="section-subtitle">Hand-picked endpoints loved by developers worldwide</p>
          </div>
          <div className="card-grid reveal-stagger">
            {featured.map((e) => (
              <ApiCard key={e.id} ep={e} descLimit={110} corners />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">▸ Browse</span>
            <h2 className="section-title">All Categories</h2>
            <p className="section-subtitle">
              {categories.length} categories · {endpoints.length} total endpoints — sorted A → Z
            </p>
          </div>
          <div className="cat-grid reveal-stagger">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="cat-card"
                style={colorVars(c.color1, c.color2)}
              >
                <div className="cat-icon-wrap">{c.icon}</div>
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.count} endpoints</p>
                </div>
                <span className="arrow">›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="section-eyebrow">▸ Why us</span>
            <h2 className="section-title">Why {BRAND.name}?</h2>
            <p className="section-subtitle">VIP-grade infrastructure built for developers who demand the best</p>
          </div>
          <div className="features-grid reveal-stagger">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Artificial Intelligence</h3>
              <p>55+ AI endpoints — chat, image generation, video synthesis, and natural language processing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Globally distributed infrastructure with intelligent caching for instant responses.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Reliable &amp; Secure</h3>
              <p>Enterprise-grade reliability with built-in authentication and rate limiting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Massive Library</h3>
              <p>
                {endpoints.length}+ endpoints across {categories.length} categories — downloaders, makers,
                search and more.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
