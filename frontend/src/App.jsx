import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { useLenis } from './hooks/useLenis';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/sections/Hero';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true, nullTargetWarn: false });
ScrollTrigger.config({ limitCallbacks: true, syncInterval: 40 });

const Problem = React.lazy(() => import("./components/sections/Problem"));
const Solution = React.lazy(() => import("./components/sections/Solution"));
const HowItWorks = React.lazy(() => import("./components/sections/HowItWorks"));
const Features = React.lazy(() => import("./components/sections/Features"));
const Stats = React.lazy(() => import("./components/sections/Stats"));
const Fairness = React.lazy(() => import("./components/sections/Fairness"));
const ForWho = React.lazy(() => import("./components/sections/ForWho"));
const CTA = React.lazy(() => import("./components/sections/CTA"));
const Footer = React.lazy(() => import("./components/sections/Footer"));

export default function App() {
  useLenis();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Initial UI Setup for Scroll Progress (GSAP ScrollTrigger)
    gsap.to("#scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3
      }
    });

    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    
    if (!dot || !ring) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      dot.style.display = 'none';
      ring.style.display = 'none';
    } else {
      gsap.set([dot, ring], { opacity: 0 }); // Hide initially
    }

    const rx = gsap.quickTo(ring, "x", { duration: 0.25, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.25, ease: "power3" });

    let isFirstMove = true;

    const onMouseMove = e => {
      if (isFirstMove) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 }); // Fade in gracefully
        isFirstMove = false;
      } else {
        gsap.set(dot, { x: e.clientX, y: e.clientY });
      }
      rx(e.clientX); ry(e.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);

    // Initial check for interactive elements
    const setupInteractiveCursor = () => {
      const interactiveElements = document.querySelectorAll("a, button, [data-hover]");
      const onEnter = () => ring.classList.add("expanded");
      const onLeave = () => ring.classList.remove("expanded");

      interactiveElements.forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });

      return () => {
        interactiveElements.forEach(el => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      };
    };

    let cleanup = setupInteractiveCursor();
    
    // Re-run interactive cursor setup if DOM changes slightly
    const observer = new MutationObserver(() => {
      cleanup();
      cleanup = setupInteractiveCursor();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cleanup();
      observer.disconnect();
    };
  }, []);

  return (
    <div className={dark ? "dark bg-ink text-paper" : "bg-paper text-ink"}>
      <div className="noise-overlay"></div>
      <div id="scroll-progress"></div>
      <div className="cursor-dot"></div>
      <div className="cursor-ring"></div>
      
      <Loader />
      <Navbar dark={dark} setDark={setDark} />
      <main>
        <section id="home"><Hero dark={dark} /></section>
        <React.Suspense fallback={<div style={{height:"100vh", background:"#0A0A0A"}} />}>
          <section id="problem"><Problem dark={dark} /></section>
          <Solution dark={dark} />
          <section id="how-it-works"><HowItWorks dark={dark} /></section>
          <section id="features"><Features dark={dark} /></section>
          <Stats dark={dark} />
          <section id="impact"><Fairness dark={dark} /></section>
          <ForWho dark={dark} />
          <CTA dark={dark} />
        </React.Suspense>
      </main>
      <React.Suspense fallback={null}>
        <Footer dark={dark} />
      </React.Suspense>
    </div>
  );
}
