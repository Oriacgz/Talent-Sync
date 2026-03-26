import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';

export default function BigNumber({ value, end, label, suffix = '', duration = 2 }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);
  
  const valToUse = value !== undefined ? value : end;
  
  useEffect(() => {
    if (inView && valToUse !== undefined) {
      const valString = String(valToUse);
      const targetValue = parseInt(valString.replace(/,/g, ''), 10);
      const isStringValue = isNaN(targetValue);

      if (!isStringValue) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: targetValue,
          duration: duration,
          ease: "power2.out",
          onUpdate: () => setDisplayValue(Math.floor(obj.val))
        });
      }
    }
  }, [inView, valToUse, duration]);

  const targetValue = parseInt(String(valToUse || 0).replace(/,/g, ''), 10);
  const isStringValue = isNaN(targetValue);

  const formattedValue = isStringValue
    ? String(valToUse ?? '')
    : displayValue.toLocaleString();

  if (!label) {
    return (
      <span ref={ref}>
        {formattedValue}{suffix}
      </span>
    );
  }

  return (
    <div ref={ref} className="flex flex-col items-start">
      <div className="font-sans font-bold text-display leading-none tracking-tighter">
        {formattedValue}{suffix}
      </div>
      <div className="font-mono text-sm uppercase tracking-widest opacity-50 mt-2">
        {label}
      </div>
    </div>
  );
}
