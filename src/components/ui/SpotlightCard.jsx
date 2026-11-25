import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * SpotlightCard
 * Interactive card with a cursor-following ambient spotlight glow.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor,
  highlight = false,
  badge = null,
  onClick,
  ...props
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={shouldReduceMotion ? {} : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.165, 0.84, 0.44, 1] }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        highlight
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-border shadow-xs hover:border-border hover:shadow-md'
      } bg-surface text-text ${className}`}
      style={{
        '--x': `${mousePos.x}px`,
        '--y': `${mousePos.y}px`,
      }}
      {...props}
    >
      {/* Radial Spotlight Glow */}
      {!shouldReduceMotion && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background:
              spotlightColor ||
              `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(54, 185, 135, 0.12), transparent 80%)`,
          }}
        />
      )}

      {badge && (
        <div className="absolute top-0 right-0 bg-primary text-primary-on text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs z-10">
          {badge}
        </div>
      )}

      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
}

export default SpotlightCard;
