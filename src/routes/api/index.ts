import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/")({
  server: {
    handlers: {
      GET: async () => {
        const { apiManifest } = await import("@/lib/proxy.server");
        return apiManifest();
      },
    },
  },
});
