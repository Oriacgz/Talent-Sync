import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SectionLabel from '../ui/SectionLabel';
import Badge from '../ui/Badge';
import PaperTear from '../ui/PaperTear';

gsap.registerPlugin(ScrollTrigger);

const FeatureCard = ({ 
  num, title, body, tech, bgColor, textColor, borderColor, icon, isHero, isExpandable, expanded, setExpanded, id 
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      // Don't tilt if expanded
      if (expanded) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8; // Max 8deg tilt
      const rotateY = ((x - centerX) / centerX) * 8;
      
      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        ease: 'power2.out',
        duration: 0.4
      });

      // Subtle gloss effect for light cards
      if (bgColor === 'bg-paper') {
        const gloss = card.querySelector('.card-gloss');
        if (gloss) {
          gsap.to(gloss, {
            opacity: 0.08,
            background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%)`,
            duration: 0.2
          });
        }
      }
    };

    const handleMouseLeave = () => {
      if (expanded) return;
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: 'elastic.out(1, 0.5)',
        duration: 0.8
      });
      
      if (bgColor === 'bg-paper') {
        const gloss = card.querySelector('.card-gloss');
        if (gloss) {
          gsap.to(gloss, { opacity: 0, duration: 0.4 });
        }
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [bgColor, expanded]);

  const handleClick = () => {
    if (isExpandable) {
      setExpanded(expanded === id ? null : id);
    }
  };

  const isDark = bgColor === 'bg-ink';
  const isExpanded = expanded === id;
  const isDimmed = expanded && !isExpanded;

  // Render SHAP Demo safely
  const renderShapDemo = () => {
    if (!isExpanded) return null;
    
    return (
      <div className="mt-8 pt-8 border-t border-ink/10 animation-expand relative z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(null); }}
          className="absolute top-8 right-0 p-2 text-ink hover:text-yellow flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h4 className="font-sans font-bold text-ink text-xl mb-2">Live SHAP Breakdown</h4>
        <p className="font-mono text-xs opacity-60 mb-8">Why Nirmala matches TechCorp at 87%</p>
        
        <div className="flex flex-col gap-3 font-mono text-[0.65rem] md:text-sm text-ink max-w-[500px]">
          {/* Base */}
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate opacity-70">Base probability</div>
            <div className="flex-grow h-[1px] bg-ink/30"></div>
            <div className="w-[60px] text-right opacity-70">0.50</div>
          </div>
          
          {/* Positive features */}
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate">Skills alignment</div>
            <div className="flex-grow flex justify-start pl-[50%]">
              <div className="h-3 bg-yellow shap-bar" style={{ width: '40px' }}></div>
            </div>
            <div className="w-[60px] text-right font-bold">+0.25</div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate">Academic score</div>
            <div className="flex-grow flex justify-start pl-[60%]">
              <div className="h-3 bg-yellow shap-bar" style={{ width: '20px' }}></div>
            </div>
            <div className="w-[60px] text-right font-bold">+0.12</div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate">Project relevance</div>
            <div className="flex-grow flex justify-start pl-[65%]">
              <div className="h-3 bg-cyan shap-bar" style={{ width: '15px' }}></div>
            </div>
            <div className="w-[60px] text-right font-bold text-cyan">+0.08</div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate">Preference match</div>
            <div className="flex-grow flex justify-start pl-[72%]">
              <div className="h-3 bg-cyan shap-bar" style={{ width: '10px' }}></div>
            </div>
            <div className="w-[60px] text-right font-bold text-cyan">+0.05</div>
          </div>
          
          {/* Negative feature */}
          <div className="flex items-center gap-2">
            <div className="w-[120px] md:w-[140px] truncate">Location factor</div>
            <div className="flex-grow flex justify-end pr-2">
              <div className="h-3 bg-pink shap-bar" style={{ width: '10px' }}></div>
            </div>
            <div className="w-[60px] text-right font-bold text-pink">-0.03</div>
          </div>
          
          {/* Final */}
          <div className="flex items-center gap-2 pt-2 border-t border-ink/20 mt-2">
            <div className="w-[120px] md:w-[140px] font-bold">FINAL SCORE</div>
            <div className="flex-grow h-[2px] bg-ink"></div>
            <div className="w-[60px] text-right font-bold">0.87</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="font-sans font-bold text-[3rem] md:text-[4rem] leading-none text-yellow tracking-tighter" style={{ WebkitTextStroke: '2px #0A0A0A' }}>
            87% MATCH
          </div>
          <div className="font-hand text-xl text-ink mt-2 -rotate-2">
            This is explainable AI &larr;
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={cardRef}
      className={`relative feature-card flex flex-col p-6 md:p-8 transition-colors duration-300
        ${bgColor} ${textColor} border-[3px] ${borderColor} 
        ${isHero ? 'min-h-[360px] md:min-h-[400px]' : 'min-h-[300px] md:min-h-[340px]'}
        ${isExpandable ? 'cursor-pointer hover:border-yellow' : ''}
        ${isDimmed ? 'opacity-[0.35] grayscale-[50%]' : 'opacity-100'}
        ${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3 min-h-[auto] shadow-brutal-lg z-20' : 'z-10'}
      `}
      style={{ transformStyle: 'preserve-3d' }}
      onClick={handleClick}
    >
      {/* Background patterns */}
      {bgColor === 'bg-paper' && (
        <div className="card-gloss absolute inset-0 opacity-0 pointer-events-none z-10 transition-opacity"></div>
      )}
      {isHero && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0A0A0A 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      )}
      
      {/* Number */}
      <div className="absolute top-6 right-6 font-mono text-sm font-bold opacity-30 select-none">
        {num}
      </div>

      <div className={`flex flex-col h-full z-10 relative ${isExpanded ? 'opacity-10 pointer-events-none absolute' : 'opacity-100 transition-opacity duration-300'}`}>
        {/* Icon */}
        <div className="mb-6 mt-4 w-12 h-12 flex items-center justify-start opacity-80">
          {icon}
        </div>
        
        {/* Headline */}
        <h3 className="font-sans font-bold text-2xl md:text-3xl leading-tight mb-3 tracking-tight max-w-[90%]">
          {title}
        </h3>
        
        {/* Body */}
        <p className="font-mono text-sm leading-relaxed opacity-65 flex-grow max-w-[280px]">
          {body}
        </p>

        {/* Tech Tag */}
        <div className="mt-8">
          <Badge label={tech} dark={isDark} />
        </div>
      </div>

      {renderShapDemo()}
      
    </div>
  );
};

export default function Features() {
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const [expandedCard, setExpandedCard] = useState(null);

  const features = [
    {
      id: 1,
      num: "01",
      title: "Conversational profile builder",
      body: "LLM guides you through profile creation. Zero form filling.",
      tech: "LLM / GROQ",
      bgColor: "bg-paper",
      textColor: "text-ink",
      borderColor: "border-ink",
      isHero: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M12 7v6"></path><path d="M12 17h.01"></path></svg>
    },
    {
      id: 2,
      num: "02",
      title: "Meaning over keywords",
      body: "-SBERT understands context. 'Python dev' matches 'scripting engineer'.",
      tech: "SBERT / SENTENCE-TRANSFORMERS",
      bgColor: "bg-yellow",
      textColor: "text-ink",
      borderColor: "border-ink",
      isHero: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="8" cy="12" r="6"></circle><circle cx="16" cy="12" r="6"></circle></svg>
    },
    {
      id: 3,
      num: "03",
      title: "Know exactly why you matched",
      body: "SHAP values decompose every score. No black boxes. Ever.",
      tech: "SHAP / XAI",
      bgColor: "bg-paper",
      textColor: "text-ink",
      borderColor: "border-ink",
      isHero: false,
      isExpandable: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><path d="M9 4h2v2H9zM15 8h2v2h-2z"></path></svg>
    },
    {
      id: 4,
      num: "04",
      title: "Equal opportunity. Built in.",
      body: "Demographic parity correction. Skill-first always.",
      tech: "FAIRNESS ML",
      bgColor: "bg-ink",
      textColor: "text-paper",
      borderColor: "border-paper",
      isHero: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 3v18"></path><rect x="4" y="9" width="4" height="6"></rect><rect x="16" y="9" width="4" height="6"></rect><path d="M6 3l12 0"></path><path d="M6 21l12 0"></path></svg>
    },
    {
      id: 5,
      num: "05",
      title: "Just describe what you want",
      body: "Type in plain English. The AI understands intent, not syntax.",
      tech: "NLP / INTENT PARSING",
      bgColor: "bg-paper",
      textColor: "text-ink",
      borderColor: "border-ink",
      isHero: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><path d="M11 8c-1.5 0-3 1.5-3 3"></path></svg>
    },
    {
      id: 6,
      num: "06",
      title: "Upload once. Never fill again.",
      body: "pdfminer + NER model extracts skills, GPA, projects automatically.",
      tech: "NER / PDFMINER",
      bgColor: "bg-ink",
      textColor: "text-paper",
      borderColor: "border-paper",
      isHero: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    }
  ];

  // SHAP Demo bars animation
  useEffect(() => {
    if (expandedCard === 3) {
      gsap.fromTo('.shap-bar',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', transformOrigin: 'left', delay: 0.2 }
      );
    }
  }, [expandedCard]);

  // Scroll Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.feature-card');
      
      // Wipe upwards entrance
      gsap.fromTo(cards, 
        { clipPath: 'inset(0 0 100% 0)', willChange: 'clip-path' },
        {
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.8,
          stagger: {
            each: 0.15,
            grid: 'auto',
            from: "start"
          },
          ease: 'power3.inOut',
          onComplete: function() { gsap.set(this.targets(), { clearProps: 'willChange' }) },
          scrollTrigger: { fastScrollEnd: true, preventOverlaps: true, 
            trigger: cardsContainerRef.current,
            start: 'top 75%',
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative bg-ink text-paper flex flex-col items-center overflow-x-hidden" style={{ padding: 'clamp(60px, 8vw, 140px) 0' }}>
      
      <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
        04
      </span>

      {/* Rip transition */}
      <div className="absolute top-0 left-0 w-full z-20 -translate-y-[1px]">
        <PaperTear topColor="#FAF9F6" bottomColor="#0A0A0A" />
      </div>

      <SectionLabel label="04 / FEATURES" dark={true} className="left-8 top-48 lg:top-64 opacity-20 hidden md:block z-20" />

      <div className="container relative z-10 flex flex-col">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row gap-12 justify-between items-end mb-[40px] md:mb-[60px] lg:mb-[80px] lg:ml-24">
          <div className="w-full md:w-[70%] flex flex-col items-start gap-6">
            <Badge label="WHAT WE BUILT" dark={true} className="border-paper text-paper opacity-80" />
            <h2 className="font-sans font-bold text-[clamp(4rem,8vw,8rem)] leading-[0.9] tracking-tighter">
              <div className="block">Built different.</div>
              <div className="block">
                Designed to <span className="inline-block px-3 pb-1 -ml-2 bg-yellow text-ink -rotate-1">win.</span>
              </div>
            </h2>
          </div>
          
          <div className="w-full md:w-[30%] flex flex-col items-end text-right md:pb-4 relative">
            <div className="font-hand text-2xl lg:text-3xl text-yellow/50 -rotate-3 mb-2 whitespace-nowrap">
              not just another job board
            </div>
            
            {/* SVG Squiggle & Arrow */}
            <svg width="200" height="20" viewBox="0 0 200 20" fill="none" className="text-yellow/50 absolute -bottom-6 right-0 -rotate-3">
              <path d="M0 10 Q 20 0, 40 10 T 80 10 T 120 10 T 160 10 T 200 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 2 L 0 10 L 10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* THE GRID */}
        <div 
          ref={cardsContainerRef}
          className="grid grid-cols-1 min-[900px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-[2px] w-full bg-ink mt-8 pb-32"
          style={{ perspective: "1000px" }}
        >
          {features.map((feat) => (
            <FeatureCard 
              key={feat.id} 
              {...feat} 
              expanded={expandedCard}
              setExpanded={setExpandedCard}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM TICKER - FLUSH FULL WIDTH */}
      <div className="w-full mt-auto relative z-20">
        <div className="w-full h-[44px] bg-yellow border-y-[3px] border-ink overflow-hidden flex items-center">
          <div className="ticker-track font-mono text-[0.7rem] text-ink font-bold uppercase tracking-[0.1em] whitespace-nowrap whitespace-pre">
            {Array(8).fill("PYTHON ✦ FASTAPI ✦ REACT ✦ POSTGRESQL ✦ SBERT ✦ SHAP ✦ SCIKIT-LEARN ✦ PANDAS ✦ NUMPY ✦ JWT ✦ DJANGO ✦ TAILWIND ✦ ").join("")}
          </div>
        </div>
      </div>

    </section>
  );
}
