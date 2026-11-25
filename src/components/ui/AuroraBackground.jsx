import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * AuroraBackground — React Bits Component
 * Creates an ultra-premium, fluid, ambient animated glow using brand colors:
 * - Primary (#36B987)
 * - Accent (#55D3A0)
 * - Deep velvet obsidian (#000000, #0E0E12) in dark mode
 * Gracefully disables motion when reduced motion is preferred.
 */
export function AuroraBackground({
  children,
  className = '',
  showRadialGradient = true,
  opacity = 0.5,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Aurora Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.15, 1],
                  x: [0, 25, 0],
                  y: [0, -20, 0],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent dark:from-primary/20 dark:via-accent/15 dark:to-transparent blur-[120px] will-change-transform"
          style={{ opacity }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.2, 1],
                  x: [0, -35, 0],
                  y: [0, 25, 0],
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: 1.5,
          }}
          className="absolute top-[25%] -right-[15%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-primary/15 via-highlight/10 to-transparent dark:from-primary/15 dark:via-highlight/10 dark:to-transparent blur-[130px] will-change-transform"
          style={{ opacity }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.1, 1],
                  x: [0, 20, 0],
                }
          }
          transition={{
            duration: 26,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute -bottom-[15%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-t from-accent/10 via-primary/10 to-transparent dark:from-accent/10 dark:via-primary/10 dark:to-transparent blur-[110px] will-change-transform"
          style={{ opacity }}
        />

        {showRadialGradient && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,var(--bg)_85%)] opacity-80" />
        )}
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
export default AuroraBackground;
