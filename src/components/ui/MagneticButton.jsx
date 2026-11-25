import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * MagneticButton — React Bits Component
 * Provides subtle, tactile magnetic attraction feedback to interactive CTAs.
 * Safe for accessibility: falls back to regular button when reduced motion is preferred.
 */
export function MagneticButton({
  children,
  className = '',
  strength = 18,
  onClick,
  disabled = false,
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || disabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    // Constrain maximum displacement
    const factor = strength / (width / 2);
    setPosition({ x: middleX * factor, y: middleY * factor });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (shouldReduceMotion) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onClick={onClick}
      disabled={disabled}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.5 }}
      whileTap={{ scale: 0.97 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default MagneticButton;
