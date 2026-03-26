import { useEffect, useRef } from "react";
import gsap from "gsap";

export function useMagnetic(strength = 0.35) {
  const ref = useRef(null);

  useEffect(() => {
    if (strength <= 0) {
      return undefined;
    }

    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const threshold = Math.max(rect.width, rect.height) * 1.2;

      if (dist < threshold) {
        gsap.to(el, {
          x: (e.clientX - cx) * strength,
          y: (e.clientY - cy) * strength,
          duration: 0.4, ease: "power2.out",
        });
      }
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.5)" });
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}
