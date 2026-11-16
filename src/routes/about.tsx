import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND, categories, endpoints } from "@/lib/rdx";

const TITLE = `About — ${BRAND.name}`;
const DESC = `${BRAND.name} offers ${endpoints.length}+ REST API endpoints across ${categories.length} categories.`;

export const Route = createFileRoute("/about")({
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
  component: About,
});

function About() {
  return (
    <main className="container page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> <span>›</span> <span>About</span>
      </nav>
      <h1 className="page-title">About {BRAND.name}</h1>

      <div className="info-card">
        <h3>What is {BRAND.name}?</h3>
        <p>
          {BRAND.name} is a powerful REST API platform offering {endpoints.length}+ endpoints across{" "}
          {categories.length} categories — including AI chat, image generation, downloaders, makers, search tools,
          and more.
        </p>
        <p>Built for developers who demand speed, reliability, and a clean developer experience.</p>
      </div>

      <div className="info-card">
        <h3>Categories</h3>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="cat-card">
              <div className="cat-icon">{c.icon}</div>
              <div>
                <h3>{c.name}</h3>
                <p>{c.count} endpoints</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="info-card">
        <h3>Contact</h3>
        <p>For questions, support, or premium plans — get in touch with the {BRAND.name} team.</p>
      </div>
    </main>
  );
}
