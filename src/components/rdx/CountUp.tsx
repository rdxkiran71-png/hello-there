import { useEffect, useRef, useState } from "react";

/** Animated counter that eases from its last value to `value` once visible. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [display, setDisplay] = useState(0);
  const shown = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const from = shown.current;
    const diff = value - from;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = p < 1 ? Math.floor(from + diff * eased) : value;
      shown.current = cur;
      setDisplay(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, visible]);

  return <h3 ref={ref}>{display.toLocaleString()}</h3>;
}
