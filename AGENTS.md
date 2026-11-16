<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The portal is a port of the SARDAR RDX Express/EJS app: `src/rdx.css` is the original stylesheet (imported from `src/styles.css`, Tailwind preflight deliberately omitted) and pages reuse its class names — keep markup class-based rather than rewriting into Tailwind, so the original look stays intact.
- Endpoint catalogue lives in `src/data/endpoints.json` and is shaped by `src/lib/rdx.ts`; pages and server routes both read from that module.
- `/api/*` is a server splat route (`src/routes/api/$.ts` → `src/lib/proxy.server.ts`) forwarding to the upstream provider; public URLs must stay at `/api/...` because external callers use them.
- Public counters live in the `site_stats` table and are only touched through security-definer RPCs from server code (`src/lib/stats.server.ts`), because workers have no writable filesystem.
