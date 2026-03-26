import React from 'react';
import BrutalButton from './ui/BrutalButton';

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center p-8 relative">
      <div className="grid-overlay"></div>
      <h1 className="text-display font-sans tracking-tighter text-center z-10 relative">
        THE AI <br/>
        <span className="highlight-word active">STARTUP</span>
      </h1>
    </section>
  ); 
}
export function DashboardPreview() {
  return (
    <section className="min-h-screen relative p-8 md:p-16 bg-ink text-paper">
      <h2 className="text-headline mb-8 font-bold highlight-word active">PREVIEW</h2>
    </section>
  ); 
}
export function CTA() {
  return (
    <section className="min-h-screen relative p-8 md:p-16 bg-yellow text-ink flex flex-col items-center justify-center text-center">
      <h2 className="text-headline mb-12 font-bold">STOP GUESSING.<br/>START SOURCING.</h2>
      <BrutalButton variant="primary" size="lg" className="text-xl px-12 py-6 bg-ink text-paper hover:bg-paper hover:text-ink">EARLY ACCESS</BrutalButton>
    </section>
  ); 
}
export function Footer() {
  return (
    <footer className="p-8 md:p-16 bg-ink text-paper border-t-4 border-paper flex justify-between items-end">
      <div className="font-sans text-headline font-bold">TS.</div>
      <p className="font-mono text-xs uppercase tracking-widest opacity-50">TalentSync © 2026</p>
    </footer>
  ); 
}
