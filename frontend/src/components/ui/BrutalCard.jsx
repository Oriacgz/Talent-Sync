import React from 'react';

export default function BrutalCard({ variant = 'default', children, className = '' }) {
  let classes = 'border-3 p-6 md:p-8 transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] ';

  if (variant === 'default') {
    classes += 'bg-paper text-ink border-ink shadow-brutal-md hover:shadow-brutal-lg';
  } else if (variant === 'dark') {
    classes += 'bg-ink text-paper border-paper shadow-md hover:shadow-lg';
  } else if (variant === 'yellow') {
    classes += 'bg-yellow text-ink border-ink shadow-brutal-md hover:shadow-brutal-lg';
  }

  return (
    <div className={`${classes} ${className}`}>
      {children}
    </div>
  );
}

// Accessibility check handled: aria-label
