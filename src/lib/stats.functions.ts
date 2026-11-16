import { createServerFn } from "@tanstack/react-start";

/** Counts one home-page visit and returns the current public counters. */
export const recordHomeVisit = createServerFn({ method: "POST" }).handler(async () => {
  const { bumpViewer } = await import("./stats.server");
  return bumpViewer();
});
