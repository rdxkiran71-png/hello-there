import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BRAND, categoryBySlug } from "@/lib/rdx";
import { ApiCard, colorVars } from "@/components/rdx/ApiCard";
import { ErrorState } from "@/components/rdx/SiteChrome";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = categoryBySlug.get(params.slug);
    if (!category) throw notFound();
    return { slug: category.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? categoryBySlug.get(loaderData.slug) : undefined;
    const title = c ? `${c.name} APIs — ${BRAND.name}` : `Not Found — ${BRAND.name}`;
    const desc = c
      ? `${c.count} ${c.name} endpoint${c.count === 1 ? "" : "s"} on the ${BRAND.name} REST API platform.`
      : "Category not found.";
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
  notFoundComponent: () => <ErrorState title="Not Found" message="Category not found." />,
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useLoaderData();
  const category = categoryBySlug.get(slug)!;
  return (
    <main className="container page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> <span>›</span> <Link to="/docs">APIs</Link> <span>›</span>{" "}
        <span>{category.name}</span>
      </nav>

      <div className="endpoint-header" style={colorVars(category.color1, category.color2)}>
        <div className="endpoint-title-row">
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              className="cat-icon-wrap"
              style={{ ...colorVars(category.color1, category.color2), width: 64, height: 64, fontSize: "2rem" }}
            >
              {category.icon}
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>
                {category.name}
              </h1>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {category.count} endpoint{category.count === 1 ? "" : "s"} available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid reveal-stagger">
        {category.items.map((e) => (
          <ApiCard key={e.id} ep={e} descLimit={130} c1={category.color1} c2={category.color2} />
        ))}
      </div>
    </main>
  );
}
