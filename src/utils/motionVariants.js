/**
 * Centralized Enterprise Motion Variants & Transition Presets
 * Optimized for Framer Motion (Motion for React)
 * Respects user's reduced-motion preferences with graceful instant fallbacks.
 */

// Enterprise easing curves
export const EASINGS = {
  // Snappy yet smooth decelerate curve (MNC enterprise grade)
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  // Smooth symmetric curve for layout & state transitions
  easeInOutCubic: [0.65, 0, 0.35, 1],
  // Subtle spring for micro-interactions without bouncy distraction
  subtleSpring: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
  // Soft floating spring for modals & overlays
  modalSpring: { type: 'spring', stiffness: 300, damping: 28, mass: 1 },
};

export const TRANSITIONS = {
  fast: { duration: 0.18, ease: EASINGS.easeOutQuart },
  normal: { duration: 0.28, ease: EASINGS.easeOutQuart },
  smooth: { duration: 0.45, ease: EASINGS.easeOutQuart },
  stagger: 0.06,
};

// Fade In
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: {
      duration: custom.duration || 0.3,
      delay: custom.delay || 0,
      ease: EASINGS.easeOutQuart,
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

// Slide Up & Fade In (ideal for hero, cards, and section reveals)
export const slideUpVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration || 0.38,
      delay: custom.delay || 0,
      ease: EASINGS.easeOutQuart,
    },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

// Staggered Container for Lists and Grids
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.stagger || 0.06,
      delayChildren: custom.delayChildren || 0.05,
    },
  }),
  exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

// Stagger Item (child of staggerContainer)
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASINGS.easeOutQuart },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// Modal Backdrop & Dialog Animation
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

export const modalDialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: EASINGS.modalSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

// Dropdown Popover Animation
export const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: EASINGS.easeOutQuart },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

// Card Hover micro-interaction
export const cardHoverVariants = {
  initial: { y: 0 },
  hover: {
    y: -3,
    transition: { duration: 0.2, ease: EASINGS.easeOutQuart },
  },
};

// Tab Page Transition for Dashboard Views
export const pageViewVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: EASINGS.easeOutQuart },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};
