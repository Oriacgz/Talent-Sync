import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SectionLabel from '../ui/SectionLabel';

gsap.registerPlugin(ScrollTrigger);

export default function Solution() {
  const triggerRef = useRef(null);
  const matchNumberRef = useRef(null);
  const [typedText, setTypedText] = useState("");

  const fullText = `student.profile → encode(SBERT) → 384-dim vector\njob.description → encode(SBERT) → 384-dim vector\nsimilarity = cosine(v1, v2)`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const tl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: triggerRef.current,
          start: "top top",
          end: "+=300%", // 300vh scroll duration
          scrub: true,
          pin: true,
        }
      });

      // ==========================================
      // FRAME 0 to 1 (0 - 33%)
      // ==========================================
      
      // Pulse animation for box when static
      const pulseAnim = gsap.to('.sol-box', {
        scale: 1.02,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Box cracks open
      tl.to('.sol-box', {
        borderColor: 'rgba(255,225,53,0.6)',
        boxShadow: '0 0 40px rgba(255,225,53,0.15)',
        onStart: () => pulseAnim.pause(),
      }, "frame1");

      // Light leaks
      tl.to('.sol-leak', {
        scaleY: 1,
        opacity: 0,
        duration: 1
      }, "frame1");

      // Text wipe in
      tl.fromTo('.sol-frame1-head',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)' }
      , "frame1");

      // Typewriter proxy (scrub creates a progress value we use)
      tl.to({ p: 0 }, {
        p: 100,
        onUpdate: function() {
          const chars = Math.floor((this.targets()[0].p / 100) * fullText.length);
          setTypedText(fullText.slice(0, chars));
        }
      }, "frame1");

      // ==========================================
      // FRAME 1 to 2 (33 - 66%)
      // ==========================================
      
      // Fade out frame 1 content
      tl.to('.sol-frame1-cont', { opacity: 0.1 }, "frame2");

      // Reveal Frame 2 content
      tl.fromTo('.sol-frame2',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0 }
      , "frame2");

      // Headline wipe
      tl.fromTo('.sol-frame2-head',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)' }
      , "frame2+=0.1");

      // Bars animate
      tl.fromTo('.sol-bar-fill',
        { scaleX: 0 },
        { scaleX: 1, stagger: 0.2, ease: 'power2.out', transformOrigin: 'left' }
      , "frame2+=0.2");

      // Number counts up
      const matchObj = { val: 0 };
      tl.to(matchObj, {
        val: 87,
        onUpdate: () => {
          if (matchNumberRef.current) {
            matchNumberRef.current.innerText = '= ' + Math.floor(matchObj.val) + '% MATCH';
          }
        }
      }, "frame2+=0.4");

      // ==========================================
      // FRAME 2 to 3 (66 - 100%)
      // ==========================================
      
      tl.to(['.sol-box-area', '.sol-frame2'], { opacity: 0.08 }, "frame3");

      tl.fromTo('.sol-frame3',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1 }
      , "frame3");

      // Waterfall animations (stagger from center)
      tl.fromTo('.wf-bar-pos',
        { scaleX: 0 },
        { scaleX: 1, stagger: 0.1, transformOrigin: 'left' }
      , "frame3+=0.1");

      tl.fromTo('.wf-bar-neg',
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'right' }
      , "frame3+=0.3");

      tl.fromTo('.sol-frame3-bot',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.1 }
      , "frame3+=0.4");

    }, triggerRef);

    return () => ctx.revert();
  }, [fullText]);

  return (
    <section id="solution" className="bg-ink text-paper relative" style={{ padding: "clamp(60px, 8vw, 140px) clamp(20px, 6vw, 100px)" }} ref={triggerRef}>
      <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center ">
        
        <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
          02
        </span>

        <SectionLabel label="02 / SOLUTION" dark={true} className="left-8 top-32 lg:top-48 opacity-20 z-50 fixed" />

        <div className="w-full max-w-[1000px] relative h-[70vh] flex flex-col items-center justify-center mb-[40px] md:mb-[60px] lg:mb-[80px]">

          {/* FRAME 0 + 1: Box and Intro */}
          <div className="absolute top-0 w-full flex flex-col items-center sol-box-area">
            <div 
              className="sol-box relative w-[200px] h-[140px] border-[3px] border-paper/15 flex items-center justify-center z-10 transition-colors bg-ink"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-paper/30">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              
              {/* Light leaks */}
              <div className="sol-leak absolute top-[-60px] left-1/2 w-[2px] h-[60px] bg-yellow transform -translate-x-1/2 origin-bottom scale-y-0 opacity-100"></div>
              <div className="sol-leak absolute bottom-[-60px] left-1/2 w-[2px] h-[60px] bg-yellow transform -translate-x-1/2 origin-top scale-y-0 opacity-100"></div>
              <div className="sol-leak absolute top-1/2 left-[-60px] w-[60px] h-[2px] bg-yellow transform -translate-y-1/2 origin-right scale-x-0 opacity-100"></div>
              <div className="sol-leak absolute top-1/2 right-[-60px] w-[60px] h-[2px] bg-yellow transform -translate-y-1/2 origin-left scale-x-0 opacity-100"></div>
            </div>
            
            <div className="mt-6 text-center sol-frame1-cont flex flex-col items-center w-full">
              <div className="font-hand text-xl text-paper/40 mb-12">How do you match fairly?</div>
              <div className="font-mono text-[0.65rem] text-paper/25 uppercase tracking-widest mb-16">Scroll to unlock.</div>
              
              <h3 className="sol-frame1-head font-sans font-bold text-[4vw] min-text-[2rem] leading-none mb-6 text-paper" style={{ clipPath: 'inset(0 100% 0 0)' }}>
                SBERT reads meaning, not keywords.
              </h3>
              
              <pre className="font-mono text-xs md:text-sm text-cyan text-left bg-cyan/[0.03] p-6 border border-cyan/10 w-fit h-[100px] overflow-hidden whitespace-pre-wrap">
                {typedText || ' '}
              </pre>
            </div>
          </div>

          {/* FRAME 2: The Three Factors */}
          <div className="sol-frame2 absolute top-1/4 w-full max-w-[600px] flex flex-col items-start opacity-0 pointer-events-none">
            <h3 className="sol-frame2-head font-sans font-bold text-3xl md:text-5xl mb-12 text-paper w-full" style={{ clipPath: 'inset(0 100% 0 0)' }}>
              Three factors. One score.
            </h3>
            
            <div className="w-full flex flex-col gap-6 font-mono text-sm">
              {[
                { label: 'SKILLS FIT', pct: 78, w: '78%' },
                { label: 'ACADEMIC MATCH', pct: 62, w: '62%' },
                { label: 'PREFERENCE ALIGN', pct: 54, w: '54%' }
              ].map((bar, i) => (
                <div key={i} className="flex justify-between items-center w-full gap-4">
                  <div className="w-32 py-1">{bar.label}</div>
                  <div className="flex-grow h-2 bg-paper/10">
                    <div className="sol-bar-fill h-full bg-yellow" style={{ width: bar.w, scaleX: 0 }}></div>
                  </div>
                  <div className="w-12 text-right">{bar.pct}%</div>
                </div>
              ))}
            </div>
            
            <div 
              ref={matchNumberRef}
              className="font-sans font-bold text-[6vw] text-yellow mt-12 tracking-tighter leading-none"
            >
              = 0% MATCH
            </div>
          </div>

          {/* FRAME 3: SHAP Waterfall Visualization */}
          <div className="sol-frame3 absolute top-1/6 w-full max-w-[700px] flex flex-col items-center opacity-0 pointer-events-none p-8 md:p-12 border border-paper/10 bg-ink shadow-2xl">
            <div className="font-hand text-3xl text-paper mb-12">Why 87%?</div>
            
            <div className="w-full font-mono text-xs md:text-sm flex flex-col gap-4">
              {/* Base */}
              <div className="flex items-center gap-4">
                <div className="w-[140px] text-paper/60 truncate">Base score</div>
                <div className="w-[200px] h-[1px] bg-paper/30 relative"></div>
                <div className="w-[80px] text-right">0.50</div>
              </div>
              
              {/* Positive features */}
              <div className="flex items-center gap-4">
                <div className="w-[140px] truncate">+ Skills</div>
                <div className="w-[200px] relative flex justify-start pl-[100px]">
                  <div className="wf-bar-pos h-3 bg-cyan w-[60px]"></div>
                </div>
                <div className="w-[80px] text-right text-cyan">+0.25</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-[140px] truncate">+ Academics</div>
                <div className="w-[200px] relative flex justify-start pl-[160px]">
                  <div className="wf-bar-pos h-3 bg-yellow w-[30px]"></div>
                </div>
                <div className="w-[80px] text-right text-yellow">+0.12</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-[140px] truncate">+ Preferences</div>
                <div className="w-[200px] relative flex justify-start pl-[190px]">
                  <div className="wf-bar-pos h-3 bg-yellow w-[20px]"></div>
                </div>
                <div className="w-[80px] text-right text-yellow">+0.08</div>
              </div>
              
              {/* Negative feature */}
              <div className="flex items-center gap-4">
                <div className="w-[140px] truncate">- Location gap</div>
                <div className="w-[200px] relative flex justify-end pr-2">
                  <div className="wf-bar-neg h-3 bg-pink w-[10px]"></div>
                </div>
                <div className="w-[80px] text-right text-pink">-0.03</div>
              </div>
              
              {/* Final */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-paper/20">
                <div className="w-[140px] text-yellow font-bold truncate">= FINAL SCORE</div>
                <div className="w-[200px] h-[2px] bg-yellow relative"></div>
                <div className="w-[80px] text-right text-yellow font-bold">0.87 (87%)</div>
              </div>
            </div>

            <h3 className="sol-frame3-bot font-sans font-bold text-[2vw] min-text-2xl mt-16 text-center text-paper">
              Every match is explainable. Always.
            </h3>
            
            <div className="sol-frame3-bot mt-8 font-hand text-xl text-yellow -rotate-2 flex flex-col items-center">
              <span>This is what fair AI looks like</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mt-2 text-yellow/50 -rotate-45" stroke="currentColor">
                <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
}
