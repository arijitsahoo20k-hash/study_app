import { Variants } from 'framer-motion'

// Easing curves
export const easings = {
  spring: [0.34, 1.56, 0.64, 1],
  smooth: [0.4, 0, 0.2, 1],
  outExpo: [0.19, 1, 0.22, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
}

// Page transitions
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.smooth }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: easings.smooth }
  },
}

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

// Item fade up
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.outExpo }
  },
}

// Scale in
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: easings.spring }
  },
}

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easings.outExpo }
  },
}

// Card hover
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.01,
    y: -2,
    transition: { duration: 0.2, ease: easings.smooth }
  },
}

// Check animation (todo completion)
export const checkVariants: Variants = {
  unchecked: { scale: 1, opacity: 1 },
  checked: {
    scale: [1, 1.3, 0.9, 1],
    transition: { duration: 0.4, ease: easings.spring }
  },
}

// Pulse glow
export const pulseGlow: Variants = {
  idle: { opacity: 0.4, scale: 1 },
  active: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  },
}

// Timer ring
export const timerRing = {
  initial: { strokeDashoffset: 0 },
  animate: (progress: number) => ({
    strokeDashoffset: progress,
    transition: { duration: 1, ease: 'linear' }
  }),
}

// Modal
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: easings.spring }
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.15, ease: easings.smooth }
  },
}

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// Number counter animation
export function animateNumber(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void
) {
  const start = performance.now()
  const update = (time: number) => {
    const elapsed = time - start
    const progress = Math.min(elapsed / duration, 1)
    // ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    callback(Math.round(from + (to - from) * eased))
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}
