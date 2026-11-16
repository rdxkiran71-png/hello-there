import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND, categories, endpoints } from "@/lib/rdx";
import { BgCanvas } from "./BgCanvas";

export function Backdrop() {
  return (
    <>
      <BgCanvas />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-scanlines" aria-hidden="true" />
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
    </>
  );
}

export function StatusBar() {
  return (
    <div className="status-bar" role="status" aria-live="polite">
      <div className="container status-inner">
        <div className="status-left">
          <span className="status-pulse" aria-hidden="true">
            <span className="status-pulse-ring" />
            <span className="status-pulse-dot" />
          </span>
          <span className="status-label">All Systems Operational</span>
        </div>
        <div className="status-rotator" aria-hidden="true">
          <span className="status-msg"><span className="status-msg-icon">⚡</span>{BRAND.name} · v2.0</span>
          <span className="status-msg"><span className="status-msg-icon">🧩</span>{endpoints.length} Live Endpoints</span>
          <span className="status-msg"><span className="status-msg-icon">📚</span>{categories.length} API Categories</span>
          <span className="status-msg"><span className="status-msg-icon">🔑</span>Free Key Available</span>
          <span className="status-msg"><span className="status-msg-icon">⏱️</span>99.9% Uptime · 24/7</span>
          <span className="status-msg"><span className="status-msg-icon">💎</span>VIP Premium Service</span>
        </div>
        <div className="status-right">
          <span className="status-version">build v2.0</span>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);
  return (
    <button
      className="theme-toggle"
      id="themeToggle"
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("theme", next);
        } catch {
          /* ignore */
        }
        setTheme(next);
      }}
    >
      <span className="theme-icon">{theme === "light" ? "☀️" : "🌙"}</span>
    </button>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const apisActive =
    pathname.startsWith("/docs") || pathname.startsWith("/endpoint") || pathname.startsWith("/category");
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-name">{BRAND.name}</span>
        </Link>
        <nav className="primary-nav">
          <Link to="/" className={pathname === "/" ? "active" : ""}>Home</Link>
          <Link to="/docs" className={apisActive ? "active" : ""}>APIs</Link>
          <Link to="/api-key" className={pathname === "/api-key" ? "active" : ""}>API Key</Link>
          <Link to="/about" className={pathname === "/about" ? "active" : ""}>About</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand">
            <span className="brand-mark">R</span>
            <span className="brand-name">{BRAND.name}</span>
          </div>
          <p className="muted">{BRAND.tagline}</p>
        </div>
        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/docs">Documentation</Link>
          <Link to="/api-key">API Key</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="footer-links">
          <h4>Stats</h4>
          <span className="muted">{endpoints.length} endpoints</span>
          <span className="muted">{categories.length} categories</span>
          <span className="muted">REST API v2.0</span>
        </div>
      </div>
      <div className="footer-bottom container">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <main className="container page">
      <div className="error-state">
        <h1 className="page-title">{title}</h1>
        <p className="muted">{message}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
