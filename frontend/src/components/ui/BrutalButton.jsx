import React from 'react';
import { useMagnetic } from '../../hooks/useMagnetic';

export default function BrutalButton({ variant = 'primary', size = 'md', surface = 'light', onClick, children, className = '' }) {
  const ref = useMagnetic(0);

  let variantClasses = '';
  let surfaceClasses = '';
  
  if (surface === 'dark') {
    surfaceClasses = 'border-paper';
    if (variant === 'primary') {
      variantClasses = 'bg-yellow text-ink';
    } else if (variant === 'secondary') {
      variantClasses = 'bg-paper text-ink';
    } else if (variant === 'ghost') {
      variantClasses = 'bg-transparent border-current shadow-none';
    }
  } else {
    surfaceClasses = 'border-ink';
    if (variant === 'primary') {
      variantClasses = 'bg-yellow text-ink';
    } else if (variant === 'secondary') {
      variantClasses = 'bg-paper text-ink';
    } else if (variant === 'ghost') {
      variantClasses = 'bg-transparent border-current shadow-none';
    }
  }

  const baseClasses = 'btn-feedback inline-flex justify-center items-center font-mono uppercase font-bold tracking-widest transition-all duration-150 border-2 rounded-[3px]';
  const sizeClasses = size === 'sm' ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm';
  const interactiveClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const borderClasses = variant === 'ghost' ? 'border-2' : '';

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`${baseClasses} ${interactiveClasses} ${variantClasses} ${surfaceClasses} ${sizeClasses} ${borderClasses} ${className}`}
    >
      {children}
    </button>
  );
}
