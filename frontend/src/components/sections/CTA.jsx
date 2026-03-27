import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import BrutalButton from '../ui/BrutalButton';
import PaperTear from '../ui/PaperTear';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const rv = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      
      const tl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: sectionRef.current,
          start: 'top 60%'
        }
      });
      
      const lines = gsap.utils.toArray('.wipe-line');
      tl.fromTo(lines, 
        { clipPath: 'inset(100% 0 0 0)' },
        { 
          clipPath: 'inset(0% 0 0 0)', 
          duration: rv ? 0 : 1, 
          stagger: 0.12, 
          ease: 'power4.inOut' 
        }
      );
      
      tl.to('.highlight-bg', {
        scaleX: 1,
        duration: rv ? 0 : 0.6,
        ease: 'power3.out',
        transformOrigin: 'left'
      }, "-=0.4");

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="cta" ref={sectionRef} className="relative bg-ink text-paper flex items-center justify-center w-full min-h-screen" style={{ padding: "clamp(60px, 8vw, 140px) clamp(20px, 6vw, 100px)" }}>
      
      {/* 08 Mark */}
      <span aria-hidden="true" style={{ position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", fontSize: "min(18vw, 220px)", fontFamily: "Space Mono", fontWeight: 700, color: "currentColor", opacity: 0.028, pointerEvents: "none", lineHeight: 1, userSelect: "none" }}>
        08
      </span>

      {/* Rip transition: Top is Paper, Bottom is Black */}
      <div className="absolute top-0 left-0 w-full z-20 -translate-y-[1px]">
        <PaperTear topColor="#FAF9F6" bottomColor="#0A0A0A" />
      </div>

      {/* Diagonal Stripe Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,225,53,0.015) 40px, rgba(255,225,53,0.015) 41px)' }}
      ></div>

      <div className="w-full max-w-[800px] flex flex-col items-center text-center relative z-10">
        
        <div className="font-mono text-sm uppercase tracking-[0.3em] opacity-30 font-bold mb-8">
          READY?
        </div>

        <h2 className="font-sans font-bold text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.9] tracking-tighter mb-6 flex flex-col items-center gap-2">
          <div className="wipe-line" style={{ clipPath: 'inset(100% 0 0 0)' }}>Stop applying blindly.</div>
          <div className="wipe-line relative flex items-center" style={{ clipPath: 'inset(100% 0 0 0)' }}>
            Start matching 
            <span className="relative inline-block ml-4 text-paper py-1 px-2 z-10">
              <span className="relative z-10 block mix-blend-difference mt-2">intelligently.</span>
              <span className="highlight-bg absolute inset-0 bg-yellow -z-0" style={{ scaleX: 0, transformOrigin: 'left' }}></span>
            </span>
          </div>
        </h2>

        <p className="font-mono text-[0.875rem] md:text-base opacity-40 max-w-lg mt-6 leading-relaxed">
          TalentSync is free. Open source. Built for students who deserve better.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 w-full sm:w-auto">
          <BrutalButton variant="primary" size="lg" className="w-full sm:w-auto font-bold bg-yellow text-ink border-ink hover:bg-yellow shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A]" onClick={() => navigate('/login')}>
            GET STARTED &rarr;
          </BrutalButton>
        </div>

        <div className="font-mono text-[0.65rem] md:text-xs uppercase tracking-widest opacity-25 mt-16 font-bold flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>Free to use</span> ✦
          <span>Built for students</span> ✦
          <span>SDG 8 aligned</span> ✦
          <span>Fair by design</span>
        </div>

      </div>

    </section>
  );
}
