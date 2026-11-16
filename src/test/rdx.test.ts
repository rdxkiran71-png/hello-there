import { describe, expect, it } from "vitest";
import { BRAND_KEY, UPSTREAM_KEY, endpointByPath, rebrandJson, swapBrandKey } from "@/lib/rdx";

describe("SARDAR RDX key + brand rules", () => {
  it("swaps the public brand key for the upstream key in forwarded URLs", () => {
    expect(swapBrandKey(`/api/ai/chat?q=hi&apikey=${BRAND_KEY}`)).toBe(`/api/ai/chat?q=hi&apikey=${UPSTREAM_KEY}`);
  });

  it("shows the brand key, never the upstream key, as the default apikey", () => {
    const ep = endpointByPath.get("/api/maker/brat")!;
    expect(ep.params.find((p) => p.name === "apikey")?.default).toBe("RDX-API-FREE-191852893");
  });

  it("rebrands upstream attribution fields to SARDAR RDX", () => {
    expect(rebrandJson({ creator: "anabot", status: true })).toEqual({ creator: "SARDAR RDX", status: true });
  });
});
