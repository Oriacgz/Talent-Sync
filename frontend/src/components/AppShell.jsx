import { useEffect } from 'react';
import gsap from 'gsap';

/**
 * Shared layout wrapper that provides the custom cursor (dot + ring)
 * and noise overlay across ALL routes — not just the landing page.
 */
export default function AppShell({ children }) {
  useEffect(() => {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    if (!dot || !ring) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    gsap.set([dot, ring], { opacity: 0 });

    const rx = gsap.quickTo(ring, 'x', { duration: 0.25, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.25, ease: 'power3' });

    let isFirstMove = true;

    const onMouseMove = (e) => {
      if (isFirstMove) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        isFirstMove = false;
      } else {
        gsap.set(dot, { x: e.clientX, y: e.clientY });
      }
      rx(e.clientX);
      ry(e.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);

    const setupInteractiveCursor = () => {
      const interactiveElements = document.querySelectorAll('a, button, [data-hover], input, select, textarea');
      const onEnter = () => ring.classList.add('expanded');
      const onLeave = () => ring.classList.remove('expanded');

      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });

      return () => {
        interactiveElements.forEach((el) => {
          el.removeEventListener('mouseenter', onEnter);
          el.removeEventListener('mouseleave', onLeave);
        });
      };
    };

    let cleanup = setupInteractiveCursor();

    const observer = new MutationObserver(() => {
      cleanup();
      cleanup = setupInteractiveCursor();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cleanup();
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Noise overlay — shared across all pages */}
      <div className="noise-overlay"></div>
      {/* Custom cursor — shared across all pages */}
      <div className="cursor-dot"></div>
      <div className="cursor-ring"></div>
      {children}
    </>
  );
}
