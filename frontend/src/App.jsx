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

    return () => {};
  }, []);

  return (
    <div className={dark ? "dark bg-ink text-paper" : "bg-paper text-ink"}>
      <div id="scroll-progress"></div>
      
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
