import { createFileRoute } from "@tanstack/react-router";

type Ctx = { request: Request; params: { _splat?: string } };

const handle = async ({ request, params }: Ctx) => {
  const { proxyToUpstream } = await import("@/lib/proxy.server");
  return proxyToUpstream(request, params._splat ?? "");
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
