import React from 'react';

export default function Badge({ label, color = 'ink', dark = false, className = '' }) {
  let colorClasses = '';

  if (dark) {
    colorClasses = 'border-paper text-paper bg-ink';
  } else {
    if (color === 'ink') colorClasses = 'border-ink text-ink bg-[var(--bg)]';
    else if (color === 'yellow') colorClasses = 'border-yellow text-ink bg-yellow/30';
    else if (color === 'cyan') colorClasses = 'border-cyan text-ink bg-cyan/25';
    else if (color === 'pink') colorClasses = 'border-pink text-ink bg-pink/25';
    else if (color === 'green') colorClasses = 'border-green text-ink bg-green/20';
  }

  return (
    <span className={`badge ${colorClasses} ${className}`}>
      {label}
    </span>
  );
}
