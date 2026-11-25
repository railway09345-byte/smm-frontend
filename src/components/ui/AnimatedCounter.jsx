import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * AnimatedCounter — React Bits Component
 * Animates numbers smoothly from 0 to target value when entering viewport.
 * Handles prefixes (e.g. '+', '$'), suffixes (e.g. '%', 'k', ' Networks'), and decimals.
 */
export function AnimatedCounter({
  value,
  duration = 1.6,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  // Parse numeric portion if string is passed
  const numericTarget = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

  // Extract implicit prefix/suffix if not explicitly passed
  const strVal = String(value);
  const detectedPrefix = prefix || (strVal.startsWith('+') ? '+' : strVal.startsWith('$') ? '$' : '');
  const detectedSuffix = suffix || (strVal.endsWith('%') ? '%' : '');

  // Detect decimal places
  const autoDecimals = decimals || (strVal.includes('.') ? (strVal.split('.')[1]?.replace(/[^0-9]/g, '').length || 0) : 0);

  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? numericTarget : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(numericTarget);
      return;
    }

    if (!isInView) return;

    let startTime = null;
    let animationFrame = null;

    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const current = numericTarget * easeOutExpo(progress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isInView, numericTarget, duration, shouldReduceMotion]);

  const formattedNumber = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: autoDecimals,
    maximumFractionDigits: autoDecimals,
  });

  return (
    <span ref={ref} className={className}>
      {detectedPrefix}
      {formattedNumber}
      {detectedSuffix}
    </span>
  );
}

export default AnimatedCounter;
