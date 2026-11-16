import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BRAND } from "@/lib/rdx";
import { Backdrop, ErrorState, Footer, Header, StatusBar } from "@/components/rdx/SiteChrome";
import { useSiteEffects } from "@/components/rdx/useSiteEffects";

function NotFoundComponent() {
  return <ErrorState title="404 — Not Found" message="The page you are looking for does not exist." />;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="container page">
      <div className="error-state">
        <h1 className="page-title">500 — Server Error</h1>
        <p className="muted">Something went wrong. You can try again or head back home.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a href="/" className="btn btn-ghost">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

const THEME_INIT = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      { name: "description", content: BRAND.description },
      { name: "author", content: BRAND.name },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.tagline}` },
      { property: "og:description", content: BRAND.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#00f0ff" },
      { name: "application-name", content: "RDX APIS" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "RDX APIS" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Orbitron:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/icons/app-icon.jpg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const href = useLocation({ select: (l) => l.href });
  useSiteEffects(href);

  return (
    <QueryClientProvider client={queryClient}>
      <Backdrop />
      <StatusBar />
      <Header />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Footer />
    </QueryClientProvider>
  );
}
