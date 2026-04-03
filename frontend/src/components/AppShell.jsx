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

    if (!dot || !ring) {
      console.warn('Cursor elements not found');
      return;
    }

    // Hide on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    // Make visible immediately
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    dot.style.position = 'fixed';
    ring.style.position = 'fixed';
    dot.style.pointerEvents = 'none';
    ring.style.pointerEvents = 'none';
    dot.style.zIndex = '99999';
    ring.style.zIndex = '99998';

    let rx, ry;
    let ctx = gsap.context(() => {
      rx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
      ry = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    });

    const onMouseMove = (e) => {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      if (rx) rx(e.clientX);
      if (ry) ry(e.clientY);

      // Ring follows with slight delay
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.25,
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    const isInteractive = (target) => {
      if (!target || !(target instanceof Element)) {
        return false;
      }
      return Boolean(target.closest('a, button, [data-hover], input, select, textarea'));
    };

    const onPointerOver = (event) => {
      if (isInteractive(event.target)) {
        ring.classList.add('expanded');
      }
    };

    const onPointerOut = (event) => {
      if (isInteractive(event.target)) {
        ring.classList.remove('expanded');
      }
    };

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerout', onPointerOut, true);

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerout', onPointerOut, true);
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
