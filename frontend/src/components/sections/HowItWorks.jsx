import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SectionLabel from '../ui/SectionLabel';
import Badge from '../ui/Badge';
import PaperTear from '../ui/PaperTear';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const bookCoverRef = useRef(null);
  const bookBackRef = useRef(null);
  const bookContentRef = useRef(null);
  const timelineTriggerRef = useRef(null);
  const activeLineRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);

  const stepsData = [
    {
      title: "USER ONBOARDS",
      top: "Student or Recruiter",
      bottom: "LLM chatbot builds profile",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
      detailTitle: "Interactive Input",
      renderVisual: () => (
        <div className="flex flex-col gap-4 w-full h-full justify-center px-2">
          {[
            { label: 'Skills', w: '85%', delay: '0s' },
            { label: 'Preferences', w: '60%', delay: '0.3s' },
            { label: 'Background', w: '95%', delay: '0.6s' }
          ].map((bar, i) => (
            <div key={i} className="flex flex-col gap-1 w-full">
              <div className="w-full h-2 bg-ink rounded-full overflow-hidden">
                <div className="h-full bg-yellow transform origin-left" style={{ width: bar.w, animation: `fillBar 1.5s ease-out forwards ${bar.delay}` }}></div>
              </div>
              <div className="font-mono text-[0.65rem] text-paper/60 uppercase tracking-widest">{bar.label}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "PROFILE ENCODED",
      top: "SBERT Encoding",
      bottom: "384-dimension vector",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>,
      detailTitle: "Vectorization",
      renderVisual: () => (
        <div className="flex items-center justify-between w-full h-full relative px-2">
          <div className="flex flex-col gap-3 z-10 w-[40%]">
            <span className="font-mono text-[0.6rem] bg-ink px-2 py-1 text-paper/80 border border-paper/10 text-center">Python</span>
            <span className="font-mono text-[0.6rem] bg-ink px-2 py-1 text-paper/80 border border-paper/10 text-center">Algorithms</span>
            <span className="font-mono text-[0.6rem] bg-ink px-2 py-1 text-paper/80 border border-paper/10 text-center">ML</span>
          </div>
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" style={{ zIndex: 0 }}>
            <line x1="35%" y1="30%" x2="65%" y2="40%" stroke="#FFE135" strokeWidth="1" strokeDasharray="4" className="animate-[pulse_2s_infinite]" />
            <line x1="35%" y1="50%" x2="65%" y2="50%" stroke="#FFE135" strokeWidth="1" strokeDasharray="4" className="animate-[pulse_2s_infinite_0.3s]" />
            <line x1="35%" y1="70%" x2="65%" y2="60%" stroke="#FFE135" strokeWidth="1" strokeDasharray="4" className="animate-[pulse_2s_infinite_0.6s]" />
          </svg>
          <div className="grid grid-cols-3 gap-2 z-10 w-[40%] pl-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full bg-cyan ${i === 4 ? 'opacity-0' : 'opacity-80'}`}></div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "JOBS FETCHED",
      top: "Live job pool",
      bottom: "All descriptions encoded",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
      detailTitle: "PGVector Search",
      renderVisual: () => (
        <div className="flex flex-col items-center justify-center w-full h-full gap-3 relative overflow-hidden">
          <div className="font-mono text-[0.65rem] text-cyan mb-2 tracking-widest uppercase opacity-80 z-20">247 jobs found</div>
          <div className="relative w-full h-[120px]">
            {['Frontend Eng', 'Data Scientist', 'ML Ops', 'Backend Dev'].map((job, i) => (
              <div key={i} className="absolute w-[90%] left-[5%] bg-paper border-2 border-paper text-ink p-2 flex items-center gap-3 shadow-sm" 
                style={{
                  top: `${i * 16}px`, 
                  zIndex: 4 - i, 
                  transform: `scale(${1 - i * 0.05})`, 
                  opacity: 1 - i * 0.15,
                  animation: `slideInRight 0.4s ease-out forwards ${i * 0.1}s`,
                  transformOrigin: 'top center'
                }}>
                <div className="w-5 h-5 bg-yellow font-bold flex items-center justify-center font-mono text-[0.5rem] shrink-0 border border-ink">
                  {(job[0]+job.split(' ')[1][0]).toUpperCase()}
                </div>
                <div className="font-sans font-bold text-[0.65rem] truncate">{job}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "SIMILARITY SCORED",
      top: "Cosine similarity",
      bottom: "Hybrid weight applied",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="16" height="2"></rect><rect x="4" y="15" width="16" height="2"></rect></svg>,
      detailTitle: "Match Algorithm",
      renderVisual: () => (
        <div className="flex flex-col items-center justify-center w-full h-full gap-6">
          <div className="flex items-center justify-between w-full relative px-6">
            <div className="w-12 h-12 rounded-full border-2 border-paper/30 flex items-center justify-center bg-ink z-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
            </div>
            
            <div className="absolute left-[4rem] right-[4rem] h-[2px] bg-yellow/20 z-0">
              <div className="absolute top-[-3px] left-0 w-2 h-2 bg-yellow rounded-full animate-[pingPong_2s_ease-in-out_infinite]"></div>
              <div className="w-full h-full bg-yellow shadow-[0_0_8px_#FFE135]"></div>
            </div>

            <div className="w-12 h-12 border-2 border-paper/30 flex items-center justify-center bg-ink z-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
          </div>
          <div className="font-sans text-4xl font-bold text-yellow mt-2 drop-shadow-[0_0_12px_rgba(255,225,53,0.3)]">87%</div>
        </div>
      )
    },
    {
      title: "SHAP EXPLAINS",
      top: "XAI layer",
      bottom: "Every decision justified",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
      detailTitle: "Explainability",
      renderVisual: () => (
        <div className="flex flex-col gap-5 w-full h-full justify-center px-2">
          {[
            { label: 'Technical Fit', val: 78 },
            { label: 'Academic Fit', val: 62 },
            { label: 'Role Fit', val: 54 }
          ].map((bar, i) => (
            <div key={i} className="flex items-center justify-between w-full gap-4">
              <div className="font-mono text-[0.55rem] tracking-wider text-paper/80 uppercase w-[90px] shrink-0 font-bold">{bar.label}</div>
              <div className="flex-grow h-3 bg-ink flex">
                <div className="h-full bg-yellow transition-all duration-1000 ease-out" style={{ width: `${bar.val}%`, animation: `growWidth 1s ease-out forwards ${i * 0.2}s` }}></div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "MATCH DELIVERED",
      top: "Ranked results",
      bottom: "With score + reason",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M22 12h-4"></path><path d="M6 12H2"></path><path d="M12 6V2"></path><path d="M12 22v-4"></path></svg>,
      detailTitle: "Frontend Render",
      renderVisual: () => (
        <div className="flex flex-col items-center justify-center w-full h-full gap-5 relative">
          <div className="bg-paper/5 border border-paper/10 py-5 px-6 w-full max-w-[220px] flex flex-col items-center gap-3 shadow-xl animate-[scaleFadeIn_0.6s_ease-out_forwards]">
            <div className="w-14 h-14 rounded-full border-2 border-yellow flex items-center justify-center text-yellow font-sans text-xl font-bold shadow-[0_0_15px_rgba(255,225,53,0.15)]">
              87%
            </div>
            <div className="font-sans font-bold text-sm text-paper tracking-wide">Data Analyst</div>
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              <span className="px-2 border border-cyan/40 text-cyan font-mono text-[0.5rem] uppercase">Python</span>
              <span className="px-2 border border-cyan/40 text-cyan font-mono text-[0.5rem] uppercase">SQL</span>
              <span className="px-2 border border-cyan/40 text-cyan font-mono text-[0.5rem] uppercase">ML</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[0.65rem] text-[#00F5D4] uppercase tracking-widest animate-[fadeIn_0.4s_ease-out_forwards_0.5s] opacity-0 font-bold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Match Ready
          </div>
        </div>
      )
    }
  ];

  // Step change simply triggers re-render. Animations are handled via CSS keyframes.

  useEffect(() => {
    const ctx = gsap.context(() => {

      // 1. BOOK FLIP
      const flipTl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: '.book-container',
          start: 'center center',
          once: true
        }
      });

      flipTl.to(bookCoverRef.current, {
        rotateY: -180,
        duration: 1.4,
        ease: 'power2.inOut',
        onUpdate: function() {
          const prog = this.progress();
          // Adjust shadow dynamically during flip
          const shadowX = Math.min(10 - prog * 20, 10);
          if (bookCoverRef.current) {
            bookCoverRef.current.style.boxShadow = `${shadowX}px 10px 0px #0A0A0A`;
          }
        }
      })
      .to(bookContentRef.current, {
        opacity: 1,
        duration: 0.4,
      }, "-=0.4")
      .to(bookCoverRef.current, {
        display: 'none',
        duration: 0
      });

      // 2. TIMELINE PINNING
      const len = stepsData.length;
      const totalScroll = 200; // vh
      
      const pinTl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: timelineTriggerRef.current,
          start: 'top top',
          end: `+=${totalScroll}%`,
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            // Map 0-1 progress to 0-5 active steps
            // We want step 0 at 0%, step 5 at 100%
            const stepFloat = progress * (len - 1);
            const stepIndex = Math.min(Math.floor(stepFloat + 0.5), len - 1);
            
            if (stepIndex !== activeStep) {
              setActiveStep(stepIndex);
            }
          }
        }
      });

      // Draw active line via scroll scrub
      const lineLen = 1800; // Should match SVG dasharray
      pinTl.fromTo(activeLineRef.current,
        { strokeDashoffset: lineLen, willChange: 'stroke-dashoffset' },
        { strokeDashoffset: 0, ease: 'none', onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) } },
        0
      );

    }, sectionRef);

    return () => ctx.revert();
  }, [activeStep, stepsData.length]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative" style={{ padding: "clamp(60px, 8vw, 140px) clamp(20px, 6vw, 100px)" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fillBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pingPong { 0%, 100% { left: 0%; transform: translateX(0); } 50% { left: 100%; transform: translateX(-100%); } }
        @keyframes growWidth { from { width: 0%; } }
        @keyframes scaleFadeIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes growLine { 0% { width: 0; } 50% { width: 100%; } 100% { width: 0; } }
      `}} />
      
      {/* Rip transition into paper */}
      <div className="absolute top-0 left-0 w-full z-20 -translate-y-[1px]">
        <PaperTear topColor="#0A0A0A" bottomColor="#FAF9F6" flip={true} />
      </div>

      <div className="bg-paper text-ink min-h-screen relative overflow-hidden">
        
        <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
          03
        </span>
        
        <SectionLabel label="03 / HOW IT WORKS" className="left-8 top-48 lg:top-64 opacity-20 hidden md:block z-20" />

        <div className="container mx-auto relative z-10">
          {/* HEADER */}
          <div className="flex flex-col items-center text-center gap-6 mb-[40px] md:mb-[60px] lg:mb-[80px]">
            <Badge label="THE PROCESS" color="ink" />
            <h2 className="font-sans text-title md:text-headline lg:text-5xl font-bold max-w-2xl tracking-tighter leading-[1.1]">
              From profile to perfect match in seconds.
            </h2>
            <p className="font-mono text-sm opacity-50 tracking-widest uppercase mt-2">
              Six steps. Two milliseconds. One right answer.
            </p>
          </div>

          {/* BOOK FLIP CONTAINER */}
          <div className="book-container w-full max-w-[500px] h-[340px] mx-auto relative perspective-[1400px] mb-12 md:mb-32 z-30">
            {/* BACK COVER */}
            <div 
              ref={bookBackRef}
              className="absolute inset-0 bg-ink border-3 border-ink/80 shadow-brutal-lg flex items-center justify-center p-8 text-center"
            >
              <div ref={bookContentRef} className="opacity-0 flex flex-col items-center justify-center gap-6 text-paper w-full">
                <Badge label="THE PROCESS" dark={true} className="border-yellow text-yellow" />
                <div className="flex flex-col gap-[6px] w-[140px] my-2">
                  <div className="h-[4px] bg-yellow/60 origin-left" style={{ animation: 'growWidth 2s ease-in-out infinite', width: '40%' }}></div>
                  <div className="h-[4px] bg-yellow/60 origin-left" style={{ animation: 'growWidth 2s ease-in-out infinite 0.3s', width: '65%' }}></div>
                  <div className="h-[4px] bg-yellow/60 origin-left" style={{ animation: 'growWidth 2s ease-in-out infinite 0.6s', width: '100%' }}></div>
                </div>
                <h3 className="font-sans text-[1.5rem] font-bold text-white tracking-tight mt-2">How matching works.</h3>
                <p className="font-mono text-[0.7rem] opacity-40 uppercase tracking-widest mt-1">
                  Scroll to trace the pipeline.
                </p>
              </div>
            </div>

            {/* FRONT COVER */}
            <div 
              ref={bookCoverRef}
              className="absolute inset-0 bg-paper border-3 border-ink shadow-brutal-lg origin-left flex flex-col justify-between p-6 z-10 backface-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(10,10,10,0.03) 4px, rgba(10,10,10,0.03) 5px)'
              }}
            >
              <div className="font-mono text-[0.6rem] uppercase tracking-widest opacity-60 font-bold">
                TALENTSYNC // MATCHING GUIDE
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="font-sans text-[4rem] text-yellow font-bold leading-none">§</div>
                <div className="font-mono font-bold text-xl tracking-widest text-ink mt-2">HOW IT WORKS</div>
              </div>
              <div className="text-right">
                <span className="font-hand text-xl opacity-80 -rotate-2 inline-block -mr-2">Open to reveal &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* PINNED TIMELINE SEQUENCE */}
      <div className="bg-paper text-ink relative" ref={timelineTriggerRef}>
        <div className="min-h-screen w-full flex flex-col justify-center ">
          <div className="w-full flex flex-col items-center lg:flex-row justify-between gap-12 max-w-[1800px] mx-auto">
            
            {/* LEFT: Nodes */}
            <div className="w-full lg:w-[60%] xl:w-[65%] relative h-auto md:h-[400px] flex md:items-center py-12 md:py-0">
              
              {/* SVG Connecting Line */}
              <div className="absolute left-[36px] md:left-0 top-0 md:top-auto w-1 md:w-full h-full md:h-8 z-0">
                <svg width="100%" height="100%" className="overflow-visible hidden md:block">
                  <line x1="0" y1="2" x2="100%" y2="2" stroke="#E0DDD8" strokeOpacity="0.2" strokeWidth="4" />
                  <line 
                    ref={activeLineRef}
                    x1="0" y1="2" x2="100%" y2="2" 
                    stroke="#FFE135" strokeWidth="4" 
                    strokeDasharray="1800" strokeDashoffset="1800"
                  />
                </svg>
                {/* Mobile vertical line */}
                <div className="w-1 h-[calc(100%-64px)] bg-[#E0DDD8]/30 md:hidden absolute left-1/2 top-8 -translate-x-1/2"></div>
                <div 
                  className="w-1 bg-yellow md:hidden absolute left-1/2 top-8 -translate-x-1/2 transition-all duration-300"
                  style={{ height: `${(activeStep / (stepsData.length - 1)) * 100}%`, maxHeight: 'calc(100% - 64px)' }}
                ></div>
              </div>

              {/* Node Placements */}
              <div className="relative md:absolute w-full flex flex-col md:flex-row justify-between items-start md:items-center z-10 px-0 md:px-12 lg:px-16 gap-8 md:gap-0">
                {stepsData.map((step, i) => {
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  const isTopDown = i % 2 === 0;
                  
                  return (
                    <div key={i} className={`relative flex flex-row md:flex-col items-center justify-start md:justify-center w-full md:w-16 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-[1.05] md:scale-[1.3] z-20' : 'scale-100 z-10'}`}>
                      
                      {/* Top content (desktop) */}
                      {isTopDown && (
                        <div className={`hidden md:block absolute bottom-[52px] w-[110px] max-w-[110px] text-center transition-all duration-300 ${isActive ? 'opacity-100 -translate-y-2' : 'opacity-70'}`}>
                          <div className="font-sans font-bold text-[0.7rem] lg:text-[0.8rem] uppercase mb-1 leading-tight">{step.title}</div>
                          <div className="font-mono text-[0.6rem] lg:text-[0.65rem] text-ink/70 leading-tight">{step.top}</div>
                        </div>
                      )}
                      
                      {/* Node Circle */}
                      <div className={`w-12 h-12 lg:w-16 lg:h-16 shrink-0 rounded-full border-[3px] flex items-center justify-center transition-colors duration-300 ${isPast ? 'bg-ink border-ink text-paper' : isActive ? 'bg-yellow border-ink text-ink' : 'bg-paper border-ink/20 text-ink/40'}`}>
                        {isPast ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <div className={`w-5 h-5 lg:w-6 lg:h-6 ${isActive ? 'animate-pulse' : ''}`}>{step.icon}</div>
                        )}
                      </div>

                      {/* Right content (mobile) */}
                      <div className={`md:hidden ml-6 text-left transition-all duration-300 ${isActive ? 'opacity-100 translate-x-2' : 'opacity-70'}`}>
                        <div className="font-sans font-bold text-[0.9rem] uppercase mb-1">{step.title}</div>
                        <div className="font-mono text-[0.7rem] text-ink/70 leading-tight">{step.bottom}</div>
                      </div>

                      {/* Bottom content (desktop) */}
                      {!isTopDown && (
                        <div className={`hidden md:block absolute top-[52px] w-[110px] max-w-[110px] text-center transition-all duration-300 ${isActive ? 'opacity-100 translate-y-2' : 'opacity-70'}`}>
                          <div className="font-sans font-bold text-[0.7rem] lg:text-[0.8rem] uppercase mb-1 leading-tight">{step.title}</div>
                          <div className="font-mono text-[0.6rem] lg:text-[0.65rem] text-ink/70 leading-tight">{step.bottom}</div>
                        </div>
                      )}
                      
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Detail Panel */}
            <div className="w-full lg:w-[40%] xl:w-[340px] shrink-0 transition-opacity duration-300">
              <div className="bg-ink border-2 border-yellow/30 border-l-[4px] border-l-yellow p-7 min-h-[300px] flex flex-col relative shadow-brutal-md">
                <div className="font-mono text-[4rem] text-yellow opacity-30 font-bold leading-none mb-2 select-none pointer-events-none -mt-4">
                  {(activeStep + 1).toString().padStart(2, '0')}
                </div>
                
                <h4 className="font-sans text-[1.25rem] font-bold text-paper mb-1 uppercase tracking-tight">
                  {stepsData[activeStep].title}
                </h4>
                
                <div className="font-mono text-xs text-cyan mb-6 tracking-widest uppercase opacity-80">
                  {stepsData[activeStep].detailTitle}
                </div>
                
                <div className="flex-grow bg-[#050505] border-2 border-cyan/30 p-4 rounded-none overflow-hidden mt-auto relative min-h-[160px]">
                  <div className="absolute top-0 left-0 w-full h-[6px] bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,245,212,0.3)_2px,rgba(0,245,212,0.3)_4px)] z-20"></div>
                  {stepsData[activeStep].renderVisual && stepsData[activeStep].renderVisual()}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="w-full bg-ink py-6 px-8 md:px-16 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 border-b border-paper/10 relative z-20">
         <Badge label="REALTIME" color="yellow" className="shadow-brutal-y border-yellow" />
         <div className="font-sans text-xl text-paper font-bold tracking-tight">
           Total time from profile to match: <span className="text-yellow">&lt; 2 seconds.</span>
         </div>
      </div>

    </section>
  );
}
