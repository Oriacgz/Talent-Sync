import React from 'react';
import { useLenis } from '../../hooks/useLenis';

export default function Footer() {
  const lenis = useLenis();

  const handleScrollTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-ink text-paper border-t-[3px] border-yellow/40 pt-[60px] pb-[40px] px-8 md:px-[8vw] relative z-30">
      
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-8 border-b border-paper/[0.08] pb-[40px]">
        
        {/* LEFT */}
        <div className="w-full md:w-1/3 flex flex-col items-start gap-3">
          <div className="font-sans text-[2.5rem] font-bold text-paper leading-none tracking-tighter">TS—</div>
          <div className="w-6 h-[2px] bg-yellow"></div>
          <p className="font-mono text-xs opacity-40 uppercase tracking-widest leading-loose max-w-[200px] mt-2 font-bold">
            AI-Driven Smart Allocation Engine
          </p>
          <div className="font-mono text-[0.6rem] text-yellow opacity-50 uppercase tracking-widest font-bold mt-4">
            ♦ SDG 8 Aligned
          </div>
        </div>

        {/* CENTER */}
        <div className="w-full md:w-1/3 flex flex-col items-start lg:items-center">
          <div className="w-full max-w-[200px]">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] opacity-30 mb-5 font-bold">NAVIGATION</div>
            <ul className="flex flex-col gap-3">
              {['HOME', 'PROBLEM', 'HOW IT WORKS', 'FEATURES', 'FAIRNESS'].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(/ /g, '-')}`} className="font-mono text-[0.75rem] uppercase tracking-widest opacity-50 hover:opacity-100 hover:text-yellow hover:pl-1 transition-all duration-150 inline-block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-1/3 flex flex-col items-start lg:items-end">
          <div className="w-full max-w-[280px] lg:text-right">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] opacity-30 mb-5 font-bold">TECH STACK</div>
            
            <div className="flex flex-wrap lg:justify-end gap-2 mb-2">
              {['React', 'Django', 'Python', 'FastAPI'].map(t => (
                <span key={t} className="font-mono text-[0.65rem] px-2 py-1 border border-paper/15 text-paper/50 hover:border-yellow hover:text-yellow hover:opacity-100 transition-colors cursor-default whitespace-nowrap">
                  {t}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap lg:justify-end gap-2">
              {['SBERT', 'SHAP', 'PostgreSQL', 'JWT'].map(t => (
                <span key={t} className="font-mono text-[0.65rem] px-2 py-1 border border-paper/15 text-paper/50 hover:border-yellow hover:text-yellow hover:opacity-100 transition-colors cursor-default whitespace-nowrap">
                  {t}
                </span>
              ))}
            </div>
            
          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="max-w-[1400px] mx-auto pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-mono text-[0.6rem] md:text-xs opacity-25 uppercase tracking-widest order-2 md:order-1 font-bold">
          © 2026 TalentSync — TE-B GRP-04
        </div>
        
        <button 
          onClick={handleScrollTop}
          className="w-9 h-9 border-2 border-paper/20 flex items-center justify-center group hover:border-yellow transition-colors order-1 md:order-3 bg-transparent"
        >
          <span className="font-mono text-paper/40 group-hover:text-yellow transition-colors">&uarr;</span>
        </button>
      </div>

    </footer>
  );
}
