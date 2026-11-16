import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { categoryByName, truncate, type Endpoint } from "@/lib/rdx";

export function colorVars(c1: string, c2: string) {
  return { "--c1": c1, "--c2": c2 } as CSSProperties;
}

export function MethodBadge({ method }: { method: string }) {
  return <span className={`method method-${method.toLowerCase()}`}>{method}</span>;
}

export function ApiCard({
  ep,
  descLimit,
  corners = false,
  c1,
  c2,
}: {
  ep: Endpoint;
  descLimit: number;
  corners?: boolean;
  c1?: string;
  c2?: string;
}) {
  const cat = categoryByName.get(ep.category);
  return (
    <Link
      to="/endpoint/$id"
      params={{ id: ep.id }}
      className={"api-card" + (corners ? " has-corners" : "")}
      style={colorVars(c1 ?? cat?.color1 ?? "#00f0ff", c2 ?? cat?.color2 ?? "#ff00d4")}
    >
      <div className="api-card-content">
        <div className="api-card-head">
          <MethodBadge method={ep.method || "GET"} />
          <span className="api-cat">{ep.category}</span>
        </div>
        <h3 className="api-name">{ep.name}</h3>
        <code className="api-path">{ep.path}</code>
        {ep.description ? <p className="api-desc">{truncate(ep.description, descLimit)}</p> : null}
      </div>
    </Link>
  );
}
