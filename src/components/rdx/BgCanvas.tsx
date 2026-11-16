import { useEffect, useRef } from "react";

/** Animated particle network behind the page (desktop, motion allowed only). */
export function BgCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const isMobile = window.innerWidth < 720 || window.matchMedia("(hover: none)").matches;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isMobile) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3 * DPR,
      vy: (Math.random() - 0.5) * 0.3 * DPR,
      r: (Math.random() * 1.6 + 0.6) * DPR,
      alpha: Math.random() * 0.5 + 0.2,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const light = document.documentElement.getAttribute("data-theme") === "light";
      const dot = light ? "20, 20, 40" : "255, 100, 110";
      const line = light ? "20, 20, 40" : "255, 80, 100";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.fillStyle = `rgba(${dot},${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const maxD = 130 * DPR;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${line},${(1 - d / maxD) * 0.18})`;
            ctx.lineWidth = DPR * 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />;
}
