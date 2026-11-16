import { createFileRoute } from "@tanstack/react-router";
import { BRAND, endpoints } from "@/lib/rdx";

export const Route = createFileRoute("/_health")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, brand: BRAND.name, endpoints: endpoints.length }),
    },
  },
});
