import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Badge from '../ui/Badge';
import BrutalButton from '../ui/BrutalButton';

gsap.registerPlugin(ScrollTrigger);

export default function ForWho() {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animations
      const tl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: sectionRef.current,
          start: 'top 70%',
        }
      });

      tl.fromTo(leftColRef.current, 
        { x: -60, opacity: 0, willChange: 'transform, opacity' },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } }
      )
      .fromTo(rightColRef.current,
        { x: 60, opacity: 0, willChange: 'transform, opacity' },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        "-=0.65"
      );
      
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="for-who" ref={sectionRef} className="bg-paper text-ink border-y-[4px] border-ink flex items-center relative overflow-hidden" style={{ padding: "clamp(60px, 8vw, 140px) clamp(20px, 6vw, 100px)" }}>
      
      <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
        07
      </span>

      <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row relative z-10">
        
        {/* Mobile Splitter (only visible on small screens) */}
        <div className="md:hidden w-full h-[4px] bg-ink my-12 opacity-20"></div>

        {/* Desktop Vertical Divder */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[4px] bg-ink -translate-x-1/2 z-10"></div>

        {/* LEFT COLUMN: STUDENTS */}
        <div ref={leftColRef} className="w-full md:w-1/2 px-8 lg:px-16 flex flex-col justify-between py-4">
          <div>
            <Badge label="FOR STUDENTS" color="ink" className="mb-8" />
            <h2 className="font-sans text-[2.5rem] font-bold leading-[1.05] tracking-tight mb-12 max-w-[420px]">
              Find the role you actually deserve.
            </h2>

            <div className="flex flex-col gap-8 mb-16">
              <div className="pl-4 border-l-[3px] border-yellow">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">See your match score before applying</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">Know your fit before you spend the time.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-yellow">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">Understand why you matched</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">Every score comes with a breakdown.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-yellow">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">Find roles that match your actual skills</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">Not just titles that sound right.</p>
              </div>
            </div>
          </div>

          <div>
            <BrutalButton variant="primary" surface="light" className="bg-yellow border-ink shadow-brutal-y w-fit px-8 py-4">
              STUDENT SIGNUP &rarr;
            </BrutalButton>
          </div>
        </div>

        {/* Mobile Splitter (only visible on small screens) */}
        <div className="md:hidden w-full h-[4px] bg-ink my-16 opacity-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-4 font-mono font-bold text-sm">VS</div>
        </div>

        {/* RIGHT COLUMN: RECRUITERS */}
        <div ref={rightColRef} className="w-full md:w-1/2 px-8 lg:px-16 flex flex-col justify-between py-4 md:pl-12 lg:pl-20">
          <div>
            <Badge label="FOR RECRUITERS" color="ink" className="mb-8" />
            <h2 className="font-sans text-[2.5rem] font-bold leading-[1.05] tracking-tight mb-12 max-w-[420px]">
              Cut screening time by <span className="text-yellow drop-shadow-sm">80%</span>.
            </h2>

            <div className="flex flex-col gap-8 mb-16">
              <div className="pl-4 border-l-[3px] border-ink opacity-90">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">Get pre-ranked candidates instantly</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">Sorted by match score, not application date.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-ink opacity-90">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">Filter by actual skill fit</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">Not just what candidates claim in their resume.</p>
              </div>
              <div className="pl-4 border-l-[3px] border-ink opacity-90">
                <h4 className="font-sans font-bold text-lg leading-tight mb-1">Transparent scoring you can explain to hiring panels</h4>
                <p className="font-mono text-[0.7rem] opacity-50 tracking-wide">SHAP breakdowns for every candidate.</p>
              </div>
            </div>
          </div>

          <div>
            <BrutalButton variant="secondary" surface="light" className="bg-paper border-ink shadow-brutal-y w-fit px-8 py-4">
              POST A ROLE &rarr;
            </BrutalButton>
          </div>
        </div>

      </div>
    </section>
  );
}
