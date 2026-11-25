import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * SplitText — React Bits Component
 * Splits a text string into staggered animated words or characters.
 * Adds an enterprise SaaS feel to headlines and titles.
 */
export function SplitText({
  text = '',
  className = '',
  wordClassName = '',
  delay = 0,
  stagger = 0.05,
  splitBy = 'words', // 'words' | 'chars'
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !text) {
    return <span className={className}>{text}</span>;
  }

  const items = splitBy === 'words' ? text.split(' ') : text.split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 12,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.45,
        ease: [0.165, 0.84, 0.44, 1],
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
    >
      {items.map((item, idx) => (
        <motion.span
          key={`${item}-${idx}`}
          variants={itemVariants}
          className={`inline-block ${wordClassName}`}
          style={{ marginRight: splitBy === 'words' && idx < items.length - 1 ? '0.28em' : 0 }}
        >
          {item}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default SplitText;
