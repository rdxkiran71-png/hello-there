import { useState, type ReactNode } from "react";

export async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
  }
}

export function CopyButton({
  getText,
  className = "copy-btn",
  children,
}: {
  getText: () => string;
  className?: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className + (copied ? " copied" : "")}
      onClick={async () => {
        const t = getText();
        if (!t) return;
        await copyText(t);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "✓ Copied!" : children}
    </button>
  );
}
