import React from 'react';
import SectionLabel from '../ui/SectionLabel';
import BigNumber from '../ui/BigNumber';
import PaperTear from '../ui/PaperTear';

export default function Stats() {

  return (
    <section id="stats" className="relative bg-paper text-ink overflow-hidden w-full" style={{ padding: 'clamp(60px, 8vw, 140px) 0' }}>
      
      <span aria-hidden="true" style={{ fontSize: "min(18vw, 220px)", opacity: 0.028, position: "absolute", right: "-2vw", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", zIndex: 0, color: "currentColor" }}>
        05
      </span>

      {/* Rip transition */}
      <div className="absolute top-0 left-0 w-full z-20 -translate-y-[1px]">
        <PaperTear topColor="#0A0A0A" bottomColor="#FAF9F6" />
      </div>

      <SectionLabel label="05 / METRICS" className="left-8 top-32 lg:top-48 opacity-20 hidden md:block z-20" />

      <div className="container relative z-10">
        
        {/* TOP RULE */}
        <div className="w-full h-[4px] bg-ink mb-12 lg:mb-20"></div>

        {/* STATS ROW - FULL BLEED EDITORIAL */}
        <div className="w-full grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4 gap-8">
          
          {/* Stat 1 */}
          <div className="flex-1 flex flex-col items-center md:items-start md:pl-4 lg:pl-12 py-4 relative group">
            <div className="font-sans text-[clamp(2.5rem,6vw,8rem)] font-bold tracking-[-0.04em] leading-none text-ink flex items-end">
              <BigNumber end={10} suffix=",000" />
              <span className="text-yellow ml-1">+</span>
            </div>
            <div className="font-mono text-[0.65rem] md:text-xs uppercase tracking-[0.12em] opacity-50 mt-2 font-bold select-none">
              Matches Possible
              <div className="text-[0.55rem] tracking-wider opacity-35 font-normal mt-1 normal-case">across all registered roles</div>
            </div>
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[80%] bg-ink/10"></div>
          </div>

          {/* Stat 2 */}
          <div className="flex-1 flex flex-col items-center md:items-start md:pl-8 lg:pl-16 py-4 relative group">
            <div className="font-sans text-[clamp(2.5rem,6vw,8rem)] font-bold tracking-[-0.04em] leading-none text-yellow flex items-end">
              <BigNumber end={87} />
              <span className="text-ink ml-1">%</span>
            </div>
            <div className="font-mono text-[0.65rem] md:text-xs uppercase tracking-[0.12em] opacity-50 mt-2 font-bold select-none">
              Average Match Score
              <div className="text-[0.55rem] tracking-wider opacity-35 font-normal mt-1 normal-case">on semantic similarity benchmarks</div>
            </div>
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[80%] bg-ink/10"></div>
          </div>

          {/* Stat 3 */}
          <div className="flex-1 flex flex-col items-center md:items-start md:pl-8 lg:pl-16 py-4 relative group">
            <div className="font-sans text-[clamp(2.5rem,6vw,8rem)] font-bold tracking-[-0.04em] leading-none text-ink flex items-end">
              <BigNumber end={500} />
              <span className="text-yellow ml-1">+</span>
            </div>
            <div className="font-mono text-[0.65rem] md:text-xs uppercase tracking-[0.12em] opacity-50 mt-2 font-bold select-none">
              Roles Indexed
              <div className="text-[0.55rem] tracking-wider opacity-35 font-normal mt-1 normal-case">across sectors and locations</div>
            </div>
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-[80%] bg-ink/10"></div>
          </div>

          {/* Stat 4 */}
          <div className="flex-1 flex flex-col items-center md:items-start md:pl-8 lg:pl-16 py-4 relative group">
            <div className="font-sans text-[clamp(2.5rem,6vw,8rem)] font-bold tracking-[-0.04em] leading-none text-yellow flex items-end">
              <span className="text-ink mr-2">&lt;</span>
              <BigNumber end={2} />
              <span className="text-ink ml-1">s</span>
            </div>
            <div className="font-mono text-[0.65rem] md:text-xs uppercase tracking-[0.12em] opacity-50 mt-2 font-bold select-none">
              To First Match
              <div className="text-[0.55rem] tracking-wider opacity-35 font-normal mt-1 normal-case">from profile to ranked results</div>
            </div>
          </div>

        </div>

        {/* BOTTOM RULE */}
        <div className="w-full h-[4px] bg-ink mt-12 lg:mt-20"></div>

        {/* Pull Quote */}
        <div className="w-full py-24 md:py-32 px-[8vw] flex justify-center text-center relative mt-8">
          
          <div className="absolute top-0 md:top-8 left-[8vw] font-hand text-[15vw] md:text-[8vw] text-yellow leading-none opacity-80 select-none">
            "
          </div>
          
          <div className="max-w-[1000px] flex flex-col items-center relative z-10">
            <h3 className="font-sans text-[clamp(2.5rem,5vw,5rem)] font-bold tracking-tight leading-[1.05]">
              We don't match resumes to jobs.<br className="hidden md:block"/>
              We match <span className="underline decoration-yellow decoration-[4px] underline-offset-8">people</span> to opportunities.
            </h3>
            
            <div className="font-mono text-[0.7rem] md:text-sm font-bold uppercase tracking-[0.2em] opacity-40 mt-12 flex items-center gap-4">
              <div className="w-8 h-[2px] bg-ink"></div>
              TALENTSYNC AI ENGINE
              <div className="w-8 h-[2px] bg-ink"></div>
            </div>
          </div>

        </div>
        
        {/* FINAL RULE */}
        <div className="w-full h-[1px] bg-ink/10"></div>

      </div>

    </section>
  );
}
