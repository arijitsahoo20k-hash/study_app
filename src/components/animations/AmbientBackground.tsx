'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      {/* Animated gradient blobs */}
      <motion.div
        className="ambient-blob ambient-blob-1"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -60, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      <motion.div
        className="ambient-blob ambient-blob-2"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 3,
        }}
      />
      <motion.div
        className="ambient-blob ambient-blob-3"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.05, 0.9, 1],
        }}
        transition={{
          duration: 18,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 6,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, #050816 100%)',
        }}
      />
    </div>
  )
}
