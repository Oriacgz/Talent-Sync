import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SectionLabel from '../ui/SectionLabel';
import Badge from '../ui/Badge';
import PaperTear from '../ui/PaperTear';

gsap.registerPlugin(ScrollTrigger);

export default function Problem() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const blocksRef = useRef([]);
  const cardsRef = useRef([]);
  const crossRef = useRef(null);
  const crossPath1Ref = useRef(null);
  const crossPath2Ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Text scrub lighting
      const words = gsap.utils.toArray('.problem-word');
      
      gsap.to(words, {
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: textRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 0.5,
        },
        color: 'rgba(10,10,10,1)',
        stagger: 0.1,
        onUpdate: function() {
          // Add active classes based on progress
          const progress = this.progress();
          const total = words.length;
          const currentIndex = Math.floor(progress * total);
          
          words.forEach((word, i) => {
            if (i <= currentIndex) {
              if (word.dataset.special === 'manual') word.classList.add('bg-yellow', 'px-1');
              if (word.dataset.special === 'biased') word.classList.add('text-pink');
              if (word.dataset.special === 'invisible') word.classList.add('line-through', 'decoration-pink', 'decoration-4');
            } else {
              if (word.dataset.special === 'manual') word.classList.remove('bg-yellow', 'px-1');
              if (word.dataset.special === 'biased') word.classList.remove('text-pink');
              if (word.dataset.special === 'invisible') word.classList.remove('line-through', 'decoration-pink', 'decoration-4');
            }
          });
        }
      });

      // 2. Left column blocks
      gsap.fromTo(blocksRef.current, 
        { x: -40, opacity: 0, willChange: 'transform, opacity' },
        {
          x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) },
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: blocksRef.current[0],
            start: 'top 80%',
          }
        }
      );

      // 3. Right column chaos stack
      const rotations = [-4, 6, -8, 3, 7, -5];
      gsap.fromTo(cardsRef.current,
        { y: -200, opacity: 0, rotation: 0, willChange: 'transform, opacity' },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out',
          rotation: i => rotations[i % rotations.length],
          onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) },
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: '.chaos-stack',
            start: 'top 70%',
          }
        }
      );

      // 4. Pink cross draw
      const crossTl = gsap.timeline({
        scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
          trigger: '.chaos-stack',
          start: 'top 50%',
        }
      });
      
      crossTl.fromTo(crossPath1Ref.current,
        { strokeDasharray: 200, strokeDashoffset: 200 },
        { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut', delay: 0.8 } // delay for cards to land
      ).fromTo(crossPath2Ref.current,
        { strokeDasharray: 200, strokeDashoffset: 200 },
        { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' },
        "-=0.2"
      ).fromTo('.chaos-annotation',
        { opacity: 0, y: 10 },
        { opacity: 0.4, y: 0, duration: 0.4 },
        "-=0.1"
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const headline = "Traditional internship allocation is manual, biased, and leaves the best candidates invisible.".split(' ');

  return (
    <section ref={sectionRef} id="problem" className="min-h-screen bg-paper text-ink relative overflow-hidden flex flex-col justify-center" style={{ padding: 'clamp(60px, 8vw, 140px) 0' }}>
      
      <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
        01
      </span>
      
      <SectionLabel label="01 / PROBLEM" className="left-8 top-32 lg:top-48 opacity-25" />
      
      <div className="container md:pl-24 lg:pl-32 relative z-10 flex flex-col gap-12 md:gap-24">
        
        {/* TOP HEADLINE AREA */}
        <div className="flex flex-col items-start gap-8 mb-[40px] md:mb-[60px] lg:mb-[80px]">
          <Badge label="THE PROBLEM" color="ink" className="opacity-80" />
          
          <h2 ref={textRef} className="font-sans text-title md:text-headline lg:text-[5rem] font-bold leading-[1.1] tracking-tighter max-w-[1000px]">
            {headline.map((word, i) => {
              const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
              let special = '';
              if (cleanWord === 'manual') special = 'manual';
              if (cleanWord === 'biased') special = 'biased';
              if (cleanWord === 'invisible') special = 'invisible';

              return (
                <span key={i} className="inline-block mr-[0.25em]">
                  <span 
                    className="problem-word inline-block transition-colors duration-300" 
                    style={{ color: 'rgba(10,10,10,0.15)' }}
                    data-special={special}
                  >
                    {word}
                  </span>
                </span>
              );
            })}
          </h2>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-8 items-center lg:items-start">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[60%] flex flex-col gap-12">
            {[
              {
                num: "01",
                title: "Hours Wasted Screening",
                desc: "Recruiters manually review hundreds of resumes for every open position. 90% are immediately discarded."
              },
              {
                num: "02",
                title: "Keyword Mismatch Kills Careers",
                desc: "Resume says 'data analysis'. Job says 'analytical skills'. SAME THING. Traditional filters miss them both."
              },
              {
                num: "03",
                title: "Zero Transparency",
                desc: "Students never know why they were rejected. No feedback. No improvement path. Just silence."
              }
            ].map((block, i) => (
              <div 
                key={i} 
                ref={el => blocksRef.current[i] = el}
                className="pl-5 border-l-[3px] border-yellow flex flex-col gap-2"
              >
                <div className="font-mono text-[0.65rem] text-yellow font-bold">{block.num}</div>
                <h3 className="font-sans font-bold text-title leading-tight">{block.title}</h3>
                <p className="font-mono text-sm opacity-60 max-w-[400px] leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[40%] flex justify-center lg:justify-end pr-0 lg:pr-12">
            <div className="chaos-stack relative w-[240px] h-[300px] mt-12 lg:mt-0">
              
              {/* Cards */}
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  ref={el => cardsRef.current[i] = el}
                  className="absolute top-0 left-6 w-[180px] h-[240px] bg-white border-2 border-ink shadow-brutal flex flex-col p-4 gap-3 bg-[length:4px_4px]"
                  style={{
                    backgroundImage: `linear-gradient(45deg, rgba(10,10,10,0.05) 25%, transparent 25%, transparent 50%, rgba(10,10,10,0.05) 50%, rgba(10,10,10,0.05) 75%, transparent 75%, transparent)`
                  }}
                >
                  <div className="w-1/2 h-4 bg-ink/10 rounded-sm"></div>
                  <div className="w-full h-2 bg-ink/5 rounded-sm mt-2"></div>
                  <div className="w-5/6 h-2 bg-ink/5 rounded-sm"></div>
                  <div className="w-4/6 h-2 bg-ink/5 rounded-sm"></div>
                </div>
              ))}

              {/* Pink X */}
              <svg 
                ref={crossRef}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-md" 
                viewBox="0 0 240 300"
              >
                <path ref={crossPath1Ref} d="M40,60 L200,240" stroke="#FF2D78" strokeWidth="12" strokeLinecap="square" fill="none" />
                <path ref={crossPath2Ref} d="M200,60 L40,240" stroke="#FF2D78" strokeWidth="12" strokeLinecap="square" fill="none" />
              </svg>

              {/* Annotation */}
              <div className="chaos-annotation absolute -bottom-8 -right-8 font-hand text-xl text-ink -rotate-2 w-max">
                This is how hiring looks today &rarr;
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* PAPER TEAR TRANSITION */}
      <div className="absolute bottom-0 left-0 w-full z-20 translate-y-[1px]">
        <PaperTear topColor="#FAF9F6" bottomColor="#0A0A0A" />
      </div>

    </section>
  );
}
