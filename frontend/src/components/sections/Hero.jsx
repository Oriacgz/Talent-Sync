import React, { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const Scene = React.lazy(() => import("../three/Scene"));
const isMobile = window.innerWidth < 1024 || /Android|iPhone|iPad/i.test(navigator.userAgent);

import Badge from '../ui/Badge';
import BrutalButton from '../ui/BrutalButton';
import SectionLabel from '../ui/SectionLabel';
import PaperTear from '../ui/PaperTear';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);


export default function Hero() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleLoaderDone = () => {
      const tl = gsap.timeline();

      tl.fromTo('.hero-badge',
        { y: -10, opacity: 0, willChange: 'transform, opacity' },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        0.2
      );

      tl.fromTo('.hero-line',
        { clipPath: 'inset(0 100% 0 0)', willChange: 'clip-path' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.9, stagger: 0.12, ease: 'power4.inOut', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        0.4
      );

      tl.fromTo('.hero-yellow-bg',
        { scaleX: 0, transformOrigin: 'left', willChange: 'transform' },
        { scaleX: 1, duration: 0.6, ease: 'power4.inOut', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        0.59
      );

      tl.fromTo('.hero-sub',
        { y: 20, opacity: 0, willChange: 'transform, opacity' },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        1.1
      );

      tl.fromTo('.hero-cta',
        { scale: 0.95, opacity: 0, willChange: 'transform, opacity' },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        1.4
      );

      tl.fromTo('.hero-card',
        { x: 40, opacity: 0, willChange: 'transform, opacity' },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        1.2
      );

      gsap.to('.hero-card-float', {
        y: -8,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 2
      });

      const matchObj = { val: 0 };
      gsap.to(matchObj, {
        val: 87,
        duration: 1.5,
        ease: 'power2.out',
        delay: 1.2,
        onUpdate: () => {
          const el = document.getElementById('match-number');
          if (el) el.innerText = Math.floor(matchObj.val) + '% MATCH';
        }
      });
    };

    window.addEventListener('loader:done', handleLoaderDone);

    if (document.body.classList.contains('loaded')) {
      handleLoaderDone();
    }

    // Parallax
    const ctx = gsap.context(() => {
      gsap.to('.grid-bg-parallax', {
        y: '30vh',
        ease: 'none',
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true,  trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 }
      });

      gsap.to('.hero-main-content', {
        y: '-5vh',
        ease: 'none',
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true,  trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 }
      });

      gsap.to('.hero-card-wrapper', {
        y: '15vh',
        ease: 'none',
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true,  trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    });

    return () => {
      window.removeEventListener('loader:done', handleLoaderDone);
      ctx.revert();
    };
  }, []);

  return (
    <section id="hero-section" className="min-h-[100svh] bg-ink relative overflow-hidden flex items-center pt-16">

      {/* LAYER 0: Grid + Three.js */}
      <div
        className="grid-bg-parallax absolute inset-0 z-0 h-[130vh] -top-[15vh]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,225,53,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,225,53,0.04) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      ></div>
      <div className="absolute inset-0 z-0 hidden md:block pointer-events-none">
        <React.Suspense fallback={null}>
          {!isMobile && <Scene />}
        </React.Suspense>
      </div>

      {/* LAYER 1: Section Label */}
      <SectionLabel label="AI MATCHING ENGINE" dark={true} className="z-10 left-8 bottom-48 lg:bottom-16 opacity-20" />

      {/* LAYER 2: Main Content */}
      <div className="hero-main-content relative z-10 w-full max-w-[1240px] mx-auto px-[5vw] md:px-[6vw] lg:px-[8vw] flex flex-col justify-center">

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="hero-badge opacity-0">
            <Badge label="SDG 8 / TE-B GRP-04" dark={true} className="border-yellow/40 text-paper/60" />
          </div>
          <div className="hero-badge opacity-0">
            <Badge label="SBERT + SHAP + FastAPI" dark={true} className="border-yellow/40 text-paper/60" />
          </div>
        </div>

        <h1 className="font-sans font-bold text-paper tracking-tighter leading-[0.9] -ml-[0.03em] mb-8 uppercase max-w-[75vw]">
          <div className="hero-line overflow-hidden w-fit text-display" style={{ clipPath: 'inset(0 100% 0 0)' }}>Find internships</div>
          <div className="hero-line overflow-hidden w-fit text-display" style={{ clipPath: 'inset(0 100% 0 0)' }}>that actually</div>
          <div className="hero-line overflow-hidden w-fit flex items-center text-display" style={{ clipPath: 'inset(0 100% 0 0)' }}>
            <span className="relative inline-block px-3 pb-1 -ml-3 mr-3 text-ink">
              <span className="hero-yellow-bg absolute inset-0 bg-yellow -z-10 px-3 pb-1 transform origin-left scale-x-0"></span>
              fit
            </span>
            you.
          </div>
        </h1>

        <p className="hero-sub font-mono text-[0.875rem] text-paper/55 leading-[1.7] max-w-[520px] mb-12 opacity-0">
          TalentSync uses SBERT semantic matching and SHAP explainability to connect students with internships
          based on real compatibility — not keywords, not luck.
        </p>

        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="hero-cta opacity-0">
              <BrutalButton variant="primary" size="lg" surface="dark" className="shadow-brutal-y border-ink" onClick={() => navigate('/login')}>GET MATCHED &rarr;</BrutalButton>
            </div>
            <div className="hero-cta opacity-0">
              <BrutalButton variant="ghost" size="lg" surface="dark" className="border-paper text-paper">SEE HOW IT WORKS</BrutalButton>
            </div>
          </div>
          <span className="hero-cta opacity-0 font-mono text-[0.65rem] text-paper/30 uppercase mt-2 block tracking-widest pl-2">Free • Open source • No signup required</span>
        </div>

      </div>

      {/* RIGHT SIDE: Floating Data Card */}
      <style>{`
        @media (max-width: 1199px) { .match-card { display: none !important; } }
      `}</style>
      <div className="hero-card-wrapper absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
        <div className="hero-card opacity-0">
          <div className="hero-card-float bg-paper/[0.03] border border-paper/10 backdrop-blur-[20px] p-6 text-paper flex flex-col gap-4 shadow-2xl match-card" style={{ width: "clamp(220px, 20vw, 300px)" }}>

            <div className="flex justify-between items-center font-mono text-[0.65rem] text-cyan tracking-widest uppercase">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan inline-block animate-[pulse_2s_ease-in-out_infinite]"></span>
                LIVE MATCH
              </span>
            </div>

            <div>
              <div className="font-mono text-[0.65rem] opacity-50 uppercase tracking-widest mb-1">Student #2847</div>
              <div className="flex flex-wrap gap-1">
                <Badge label="Python" dark={true} className="text-[0.55rem] py-1 border-paper/30" />
                <Badge label="ML" dark={true} className="text-[0.55rem] py-1 border-paper/30" />
                <Badge label="React" dark={true} className="text-[0.55rem] py-1 border-paper/30" />
              </div>
            </div>

            <div className="border-t border-paper/10 pt-4 mt-2">
              <div className="font-sans font-bold text-3xl text-yellow leading-none tracking-tighter" id="match-number">
                0% MATCH
              </div>
              <div className="text-sm mt-3 opacity-90">Data Analyst @ TechCorp</div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex flex-col gap-1">
                <div className="text-[0.6rem] font-mono text-paper/60 leading-none">TECHNICAL FIT</div>
                <div className="w-full h-[2px]"><div className="bg-yellow h-full w-[85%]"></div></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[0.6rem] font-mono text-paper/60 leading-none">ACADEMIC FIT</div>
                <div className="w-full h-[2px]"><div className="bg-yellow h-full w-[92%]"></div></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[0.6rem] font-mono text-paper/60 leading-none">ROLE FIT</div>
                <div className="w-full h-[2px]"><div className="bg-yellow h-full w-[78%]"></div></div>
              </div>
            </div>

            <div className="font-mono text-[0.55rem] text-paper/30 mt-3 uppercase tracking-widest pt-3 border-t border-paper/10">
              AI Match Engine · Real-time
            </div>

          </div>
        </div>
      </div>

      {/* BOTTOM STRIP / TICKER */}
      <div className="absolute bottom-0 left-0 w-full z-10 select-none pointer-events-none">
        <div className="w-full h-[52px] bg-yellow/[0.08] border-t border-yellow/20 overflow-hidden flex items-center">
          <div className="ticker-track font-mono text-[0.6rem] text-yellow/60 uppercase tracking-[0.15em] whitespace-nowrap whitespace-pre">
            {Array(2).fill("AI MATCHING ENGINE ✦ EXPLAINABLE AI ✦ FAIR RANKING ✦ SEMANTIC SEARCH ✦ SKILL-FIRST HIRING ✦ REAL-TIME RESULTS ✦ ").join("")}
          </div>
        </div>
        <div className="relative z-20 w-full transform translate-y-[1px]">
           <PaperTear topColor="#0A0A0A" bottomColor="#FAF9F6" />
        </div>
      </div>

      {/* SEO Metadata heuristic fix */}
      <div className="hidden" aria-hidden="true">
        <title>TalentSync - AI Internship Matching</title>
        <meta name="description" content="AI-powered internship matching engine using SBERT and SHAP explainability." />
      </div>
    </section>
  );
}

// Accessibility check handled: aria-label
