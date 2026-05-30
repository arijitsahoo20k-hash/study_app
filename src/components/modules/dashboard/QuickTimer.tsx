'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, Pause, RotateCcw, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils/dates'

const POMODORO = 25 * 60

export function QuickTimer() {
  const [timeLeft, setTimeLeft] = useState(POMODORO)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (timeLeft === 0) {
      setRunning(false)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, timeLeft])

  const reset = () => { setRunning(false); setTimeLeft(POMODORO) }
  const progress = (POMODORO - timeLeft) / POMODORO
  const circumference = 2 * Math.PI * 40

  return (
    <div className="card-premium p-6">
      <div className="section-header mb-4">
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-purple-400" />
          <h2 className="section-title">Focus Timer</h2>
        </div>
        <Link
          href="/dashboard/timer"
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Full timer <ChevronRight size={14} />
        </Link>
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <svg width="100" height="100" className="-rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            {/* Progress */}
            <motion.circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white/90 tabular-nums font-mono">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Glow when running */}
          <AnimatePresence>
            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="p-2 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200"
          >
            {running ? <Pause size={15} /> : <Play size={15} />}
            {running ? 'Pause' : 'Start'}
          </button>
        </div>

        <p className="text-xs text-white/25">Pomodoro · 25 min</p>
      </div>
    </div>
  )
}
