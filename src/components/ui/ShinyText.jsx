import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * ShinyText — React Bits Component
 * An elegant light-sweep shimmer effect across text using CSS background-clip.
 * Uses brand champagne/burgundy gradient reflections.
 */
export function ShinyText({
  children,
  className = '',
  speed = 4,
  shimmerColor = 'rgba(254, 215, 184, 0.85)',
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, currentColor 0%, currentColor 38%, ${shimmerColor} 50%, currentColor 62%, currentColor 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `shiny-sweep ${speed}s linear infinite`,
      }}
    >
      {children}
    </span>
  );
}

export default ShinyText;
