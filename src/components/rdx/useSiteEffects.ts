import { useEffect } from "react";

/** Re-applies scroll reveal, card tilt and hero parallax after each page change. */
export function useSiteEffects(href: string) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const timer = setTimeout(() => {
      const revealEls = document.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger");
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
      );
      revealEls.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
      const fallback = setTimeout(() => {
        revealEls.forEach((el) => {
          if (!el.classList.contains("visible") && el.getBoundingClientRect().top < window.innerHeight)
            el.classList.add("visible");
        });
      }, 600);
      cleanups.push(() => clearTimeout(fallback));

      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const setupTilt = (el: HTMLElement, max: number) => {
        const update = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
          el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-6px)`;
          el.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
          el.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
        };
        const reset = () => {
          el.style.transform = "";
        };
        el.addEventListener("mousemove", update);
        el.addEventListener("mouseleave", reset);
        cleanups.push(() => {
          el.removeEventListener("mousemove", update);
          el.removeEventListener("mouseleave", reset);
        });
      };
      document.querySelectorAll<HTMLElement>(".api-card").forEach((c) => setupTilt(c, 6));
      document.querySelectorAll<HTMLElement>(".cat-card").forEach((c) => setupTilt(c, 5));

      const hero = document.querySelector<HTMLElement>(".hero-inner");
      const heroParent = hero?.parentElement;
      if (hero && heroParent) {
        const move = (e: MouseEvent) => {
          const rect = heroParent.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
          hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        };
        const leave = () => {
          hero.style.transform = "";
        };
        heroParent.addEventListener("mousemove", move);
        heroParent.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          heroParent.removeEventListener("mousemove", move);
          heroParent.removeEventListener("mouseleave", leave);
        });
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      cleanups.forEach((fn) => fn());
    };
  }, [href]);
}
