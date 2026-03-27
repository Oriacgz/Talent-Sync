import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SectionLabel from '../ui/SectionLabel';
import Badge from '../ui/Badge';
import BigNumber from '../ui/BigNumber';
import PaperTear from '../ui/PaperTear';

gsap.registerPlugin(ScrollTrigger);

const Gauge = ({ label, value, sub, colorClass, percent }) => {
  const barRef = useRef(null);
  
  // Custom component for the animated value specific to the gauge format
  const ValueTarget = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Bar Fill
      gsap.fromTo(barRef.current,
        { scaleX: 0 },
        {
          scaleX: percent / 100,
          duration: 1.5,
          ease: 'power3.out',
          transformOrigin: 'left',
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: barRef.current,
            start: 'top 85%',
          }
        }
      );
      
      // Animate Number safely if it's not a generic BigNumber situation (e.g. floats)
      if (ValueTarget.current) {
         let startObj = { val: 0 };
         gsap.to(startObj, {
           val: value,
           duration: 1.5,
           ease: 'power3.out',
           scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
             trigger: ValueTarget.current,
             start: 'top 85%'
           },
           onUpdate: () => {
             if (ValueTarget.current) {
               // Format based on if the value is a float < 1 or a percentage
               let num = startObj.val;
               if (value < 1) {
                 ValueTarget.current.innerText = num.toFixed(2);
               } else {
                 ValueTarget.current.innerText = Math.round(num);
               }
             }
           }
         });
      }
    });
    return () => ctx.revert();
  }, [percent, value]);

  const isFloat = value < 1;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[480px]">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[0.65rem] md:text-sm uppercase tracking-widest opacity-50 font-bold">
            {label}
          </div>
          <div className="font-sans text-3xl md:text-5xl font-bold tracking-tighter tabular-nums flex items-baseline">
            {typeof value === 'number' ? (
              <>
                <span ref={ValueTarget}>0</span>
                {!isFloat && <span className="text-2xl ml-1">%</span>}
              </>
            ) : (
              <span className="text-yellow">{value}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Background Track */}
      <div className="w-full h-[6px] bg-paper/10 mt-2 relative overflow-hidden flex items-center px-[1px]">
        {/* Fill */}
        <div 
          ref={barRef}
          className={`h-[4px] ${colorClass} will-change-transform`}
          style={{ width: '100%', scaleX: 0, transformOrigin: 'left' }}
        ></div>
      </div>
      
      <div className="font-mono text-xs opacity-60 mt-1">
        {sub}
      </div>
    </div>
  );
};


export default function Fairness() {
  const sectionRef = useRef(null);
  const arrowRef = useRef(null);
  const stampRef = useRef(null);
  const teamRefs = useRef([]);

  const addToRefs = el => {
    if (el && !teamRefs.current.includes(el)) {
      teamRefs.current.push(el);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // Animate Arrow drawn on scroll
      gsap.fromTo(arrowRef.current,
        { strokeDasharray: 200, strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: '.comparison-container',
            start: 'top 60%',
          }
        }
      );

      // Animate Stamp
      gsap.fromTo(stampRef.current,
        { scale: 1.3, opacity: 0, rotate: -5 },
        {
          scale: 1,
          opacity: 1,
          rotate: 3,
          duration: 0.5,
          ease: 'back.out(1.7)',
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: stampRef.current,
            start: 'top 80%',
          }
        }
      );

      // Team card hover effects (random slight rotation)
      teamRefs.current.forEach((card, i) => {
        const tilt = i % 2 === 0 ? 1.5 : -1.5;
        
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { 
            rotate: tilt, 
            y: -4, 
            borderColor: 'rgba(255,225,53,0.6)',
            backgroundColor: 'rgba(255,225,53,0.04)',
            duration: 0.2, 
            ease: 'power2.out' 
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { 
            rotate: 0, 
            y: 0, 
            borderColor: 'rgba(250,249,246,0.12)',
            backgroundColor: 'transparent',
            duration: 0.2, 
            ease: 'power2.out' 
          });
        });
      });

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="fairness" ref={sectionRef} className="relative bg-ink text-paper w-full" style={{ padding: "clamp(60px, 8vw, 140px) clamp(20px, 6vw, 100px)" }}>
      
      <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
        06
      </span>

      {/* Rip transition */}
      <div className="absolute top-0 left-0 w-full z-20 -translate-y-[1px]">
        <PaperTear topColor="#FAF9F6" bottomColor="#0A0A0A" />
      </div>

      <div className="relative overflow-hidden pl-0">
        <SectionLabel label="06 / FAIRNESS & IMPACT" dark={true} className="left-8 top-48 lg:top-64 opacity-20 hidden md:block z-20" />

        <div className="container relative mx-auto mx-auto relative z-10 flex flex-col">
          
          {/* HEADER */}
          <div className="flex flex-col items-start gap-4 mb-[40px] md:mb-[60px] lg:mb-[80px] lg:ml-24">
            <Badge label="SDG 8 ALIGNED" dark={true} className="border-yellow/40 text-yellow" />
            
            <h2 className="font-sans font-bold text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.9] tracking-tighter mt-4 max-w-4xl">
              <div className="block text-paper">Fairness isn't optional.</div>
              <div className="block mt-2">
                It's the <span className="bg-yellow text-ink px-[12px] leading-none inline-block -rotate-1 rounded-sm">algorithm.</span>
              </div>
            </h2>
            
            <p className="font-mono text-sm opacity-50 max-w-[480px] leading-relaxed mt-6">
              We monitor demographic parity, skill-first ranking, and bias scores on every match. Transparently.
            </p>
          </div>

          {/* TWO COLUMN CONTENT */}
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-12 lg:ml-24 comparison-container relative pb-16">
            
            {/* LEFT: Gauges */}
            <div className="w-full lg:w-1/2 flex flex-col gap-12 pt-4">
              <Gauge 
                label="HIRING PHILOSOPHY" 
                value="SKILL-FIRST" 
                sub="We rank by what you can do, not where you studied." 
                percent={100} 
                colorClass="bg-yellow" 
              />
              <Gauge 
                label="DEGREE REQUIREMENTS" 
                value="ZERO" 
                sub="No filter for institution rank. Skills define your eligibility." 
                percent={100} 
                colorClass="bg-yellow" 
              />
              <Gauge 
                label="MATCH IS EXPLAINED" 
                value="EVERY" 
                sub="See the exact reason behind your score. Always." 
                percent={100} 
                colorClass="bg-yellow" 
              />
              
              <div className="font-hand text-xl text-yellow/80 opacity-45 mt-4 -rotate-2">
                These are commitments, not features.
              </div>
            </div>

            {/* RIGHT: Visual Comparison */}
            <div className="w-full lg:w-1/2 flex flex-col items-center gap-6 relative">
              
              {/* BEFORE CARD */}
              <div className="w-full max-w-[480px] bg-pink/5 border-2 border-pink/30 border-l-4 border-l-pink p-6 flex flex-col relative z-10">
                <Badge label="TRADITIONAL HIRING" color="pink" className="border-pink text-pink self-start mb-6" />
                
                <div className="flex flex-col gap-4">
                  {/* Profile A */}
                  <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-paper/10 flex items-center justify-center font-mono text-xs">A</div>
                      <div>
                        <div className="font-sans font-bold text-paper text-sm line-through">Top-tier college student, avg skills</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                  </div>
                  
                  {/* Profile B (Rejected) */}
                  <div className="flex items-center justify-between border border-pink/30 bg-pink/10 p-3 rounded-none relative">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink/20 flex items-center justify-center font-mono text-xs text-pink">B</div>
                      <div>
                        <div className="font-sans font-bold text-paper text-sm">Mid-tier college, exceptional skills</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                </div>
                
                <div className="font-mono text-[0.65rem] text-pink mt-6 opacity-80 uppercase tracking-widest text-center">
                  Selected by college brand, not ability.
                </div>
              </div>
              
              {/* Arrow Connection */}
              <div className="h-12 w-2 flex justify-center py-2 z-0 relative">
                <svg width="2" height="40" className="absolute top-0 overflow-visible text-paper/30">
                  <line 
                    ref={arrowRef}
                    x1="1" y1="0" x2="1" y2="40" 
                    stroke="currentColor" strokeWidth="2" strokeDasharray="10 6" 
                  />
                  <polygon points="1,40 5,32 -3,32" fill="currentColor" transform="translate(0, 4)" />
                </svg>
              </div>
              
              {/* AFTER CARD */}
              <div className="w-full max-w-[480px] bg-yellow/5 border-2 border-yellow/25 border-l-4 border-l-yellow p-6 flex flex-col relative z-10 shadow-brutal-y-sm">
                <Badge label="TALENTSYNC" color="yellow" className="self-start mb-6" />
                
                <div className="flex flex-col gap-4">
                  {/* Profile A */}
                  <div className="flex items-center justify-between opacity-50 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-paper/10 flex items-center justify-center font-mono text-xs">A</div>
                      <div>
                        <div className="font-sans font-bold text-paper text-sm">Top-tier college student, avg skills</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile B (Selected) */}
                  <div className="flex items-center justify-between border-2 border-yellow bg-yellow/10 p-3 rounded-none relative">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow/20 flex items-center justify-center font-mono text-xs text-yellow font-bold">B</div>
                      <div>
                        <div className="font-sans font-bold text-yellow text-md">Mid-tier college, exceptional skills</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
                
                <div className="font-mono text-[0.65rem] text-yellow mt-6 opacity-80 uppercase tracking-widest text-center font-bold">
                  Selected by demonstrated ability.
                </div>
              </div>

            </div>
          </div>
          
        </div>
        
        {/* SDG STAMP (Moved to section relative wrapper to avoid overlap) */}
        <div ref={stampRef} className="absolute bottom-12 right-12 border-2 border-yellow/40 p-4 md:p-6 rotate-3 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none origin-center z-10 transition-transform">
          <div className="font-mono text-2xl md:text-3xl text-yellow font-bold uppercase tracking-widest opacity-90 border-b border-yellow/40 pb-2 mb-2 text-center w-full">
            SDG 8
          </div>
          <div className="font-sans text-[0.6rem] md:text-xs text-paper opacity-80 uppercase tracking-widest font-bold text-center">
            Decent Work &<br/>Economic Growth
          </div>
        </div>
        
      </div>

      {/* TEAM SECTION (Nested inside Fairness background) */}
      <div className="w-full border-t border-paper/10 px-8 md:px-[8vw] bg-ink">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] opacity-30 mb-8 font-bold text-paper relative pl-0">
            BUILT BY
          </div>

          <div className="flex flex-wrap gap-4 md:gap-6 items-stretch justify-start">
            
            {/* Team Members */}
            {[
              { id: "01", name: "Nirmala Patole", prn: "23104158" },
              { id: "02", name: "Apoorva Puranik", prn: "23104022" },
              { id: "03", name: "Alok Sahoo", prn: "23104011" },
              { id: "04", name: "Vaibhavi Naik", prn: "23104104" }
            ].map((member, idx) => (
              <div 
                key={idx} 
                ref={addToRefs}
                className="w-full sm:w-[calc(50%-8px)] lg:w-[180px] p-5 border-2 border-paper/10 bg-transparent flex flex-col justify-between min-h-[140px] cursor-default transition-none"
              >
                <div className="font-mono text-[0.6rem] text-yellow font-bold opacity-40 mb-3">{member.id}</div>
                <div>
                  <h4 className="font-sans text-paper font-bold text-[1rem] leading-tight mb-2 tracking-tight">{member.name}</h4>
                  <div className="font-mono text-[0.6rem] text-paper opacity-40 mb-1">{member.prn}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      
    </section>
  );
}
