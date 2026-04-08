import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import BrutalButton from './ui/BrutalButton';
import { getLenis } from '../hooks/useLenis';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('home');
  const mobileMenuRef = useRef(null);
  const mobileLinksRef = useRef([]);
  const navigate = useNavigate();

  const links = [
    { name: 'HOME', id: 'home' },
    { name: 'PROBLEM', id: 'problem' },
    { name: 'HOW IT WORKS', id: 'how-it-works' },
    { name: 'FEATURES', id: 'features' },
    { name: 'IMPACT', id: 'impact' },
  ];

  useEffect(() => {
    let ctx = gsap.context(() => {});
    let lastScrollY = 0;
    let ticking = false;

    const onScroll = () => {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(() => {
          if (lastScrollY > 80) {
            ctx.add(() => {
              gsap.to(navRef.current, {
                backdropFilter: "blur(12px)",
                backgroundColor: "rgba(10,10,10,0.92)",
                duration: 0.3, ease: "power2.out"
              });
            });
          } else {
            ctx.add(() => {
              gsap.to(navRef.current, {
                backdropFilter: "blur(0px)",
                backgroundColor: "transparent",
                duration: 0.3
              });
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    let ctx = gsap.context(() => {});
    // Mobile menu animations
    if (mobileMenuOpen) {
      ctx.add(() => {
        gsap.fromTo(mobileMenuRef.current, 
          { x: '100vw' },
          { x: 0, duration: 0.5, ease: 'power3.out' }
        );
        
        gsap.fromTo(mobileLinksRef.current,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, delay: 0.2, ease: 'power2.out' }
        );
      });
    }
    return () => ctx.revert();
  }, [mobileMenuOpen]);

  useEffect(() => {
    // Active section tracking with IntersectionObserver
    const sectionIds = ["home","problem","how-it-works","features","impact"];
    const observers = sectionIds
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) {
          return null;
        }
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setActiveHash(id);
            }
          },
          { threshold: 0, rootMargin: "-20% 0px -50% 0px" }
        );
        obs.observe(el);
        return obs;
      })
      .filter(Boolean);
    
    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Use Lenis if available, else native
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, { offset: -80, duration: 1.4 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    setMobileMenuOpen(false);
  };

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      <nav 
        ref={navRef}
        className="fixed top-0 left-0 w-full h-[72px] z-[9000] flex justify-between items-center px-6 md:px-12 border-b border-[rgba(250,249,246,0.08)] bg-transparent"
      >
        {/* Left: Logo */}
        <div className="flex items-center group cursor-pointer" onClick={() => scrollToSection('home')}>
          <span className="font-sans font-black text-paper relative tracking-[-0.02em]" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}>
            <span className="highlight-word group-hover:after:w-full tracking-tighter flex items-center">
              TS<span className="inline-block w-[1.2rem] border-b-[3px] border-yellow mb-[0.2rem] ml-[0.1rem]"></span>
            </span>
          </span>
        </div>

        {/* Center: Nav Links (Desktop) */}
        <div className="hidden min-[900px]:flex items-center" style={{ gap: 'clamp(24px, 3vw, 48px)' }}>
          {links.map((link, i) => {
            const isActive = activeHash === link.id;
            return (
              <button 
                key={i} 
                onClick={() => scrollToSection(link.id)}
                className={`relative font-mono uppercase tracking-widest transition-colors duration-200 group ${isActive ? 'text-yellow opacity-100' : 'text-paper/50 hover:text-paper hover:opacity-100'}`}
                style={{
                  fontSize: 'clamp(0.85rem, 1vw, 1rem)',
                  borderBottom: isActive ? "2px solid #FFE135" : "2px solid transparent",
                  paddingBottom: "4px"
                }}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        {/* Right: Button & Hamburger */}
        <div className="flex items-center gap-6">
          <BrutalButton variant="primary" className="hidden min-[900px]:inline-flex shrink-0 border-ink" style={{ padding: 'clamp(12px, 0.8vw, 16px) clamp(20px, 1.5vw, 32px)', fontSize: 'clamp(0.85rem, 1vw, 1rem)' }} onClick={() => navigate('/login')}>
            GET MATCHED &rarr;
          </BrutalButton>
          
          {/* Hamburger (Mobile) */}
          <button 
            className="min-[900px]:hidden flex flex-col justify-center items-center w-7 h-7 gap-[8px] z-[99999] relative"
            onClick={toggleMenu}
          >
            <span 
              className={`w-[28px] h-[2px] bg-paper block transition-transform duration-300 transform-origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`}
            ></span>
            <span 
              className={`w-[28px] h-[2px] bg-paper block transition-transform duration-300 transform-origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`}
            ></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="fixed inset-0 w-full h-full bg-ink z-[9999] border-l-4 border-yellow flex flex-col justify-center px-8"
          style={{ transform: 'translateX(100vw)' }}
        >
          <div className="flex flex-col gap-6">
            {links.map((link, i) => (
              <button 
                key={i} 
                onClick={() => scrollToSection(link.id)}
                className="font-sans text-5xl font-bold text-paper tracking-tighter text-left"
                ref={el => mobileLinksRef.current[i] = el}
              >
                {link.name}
              </button>
            ))}
          </div>
          
          <div className="mt-16" ref={el => mobileLinksRef.current[links.length] = el}>
            <BrutalButton variant="primary" className="w-full py-4 text-lg" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
              GET MATCHED &rarr;
            </BrutalButton>
          </div>

          <div 
            className="absolute bottom-4 left-8 font-mono text-xs uppercase text-yellow opacity-60 tracking-widest"
          >
            v1.0.0
          </div>
        </div>
      )}
    </>
  );
}
