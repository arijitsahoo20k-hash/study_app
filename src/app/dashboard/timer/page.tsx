'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem } from '@/lib/utils/animations'
import { format } from 'date-fns'

type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown'
type PomodoroPhase = 'focus' | 'short_break' | 'long_break'

const POMODORO_DURATIONS: Record<PomodoroPhase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

const phaseLabels: Record<PomodoroPhase, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
}

const phaseColors: Record<PomodoroPhase, string> = {
  focus: '#3B82F6',
  short_break: '#10B981',
  long_break: '#8B5CF6',
}

export default function TimerPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [phase, setPhase] = useState<PomodoroPhase>('focus')
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(POMODORO_DURATIONS.focus)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)

  // Countdown state
  const [countdownTotal, setCountdownTotal] = useState(10 * 60)
  const [countdownTime, setCountdownTime] = useState(10 * 60)
  const [countdownRunning, setCountdownRunning] = useState(false)
  const [countdownInput, setCountdownInput] = useState({ h: 0, m: 10, s: 0 })

  const intervalRef = useRef<NodeJS.Timeout>()
  const sessionStartRef = useRef<Date | null>(null)

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // Pomodoro tick
  useEffect(() => {
    if (mode !== 'pomodoro') return
    clearInterval(intervalRef.current)
    if (pomodoroRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date()
      intervalRef.current = setInterval(() => {
        setPomodoroTime((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            setPomodoroRunning(false)
            handlePomodoroComplete()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [pomodoroRunning, mode])

  // Stopwatch tick
  useEffect(() => {
    if (mode !== 'stopwatch') return
    clearInterval(intervalRef.current)
    if (stopwatchRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date()
      intervalRef.current = setInterval(() => setStopwatchTime((t) => t + 1), 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [stopwatchRunning, mode])

  // Countdown tick
  useEffect(() => {
    if (mode !== 'countdown') return
    clearInterval(intervalRef.current)
    if (countdownRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date()
      intervalRef.current = setInterval(() => {
        setCountdownTime((t) => {
          if (t <= 1) { clearInterval(intervalRef.current); setCountdownRunning(false); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [countdownRunning, mode])

  const handlePomodoroComplete = () => {
    setPomodoroCount((c) => {
      const newCount = phase === 'focus' ? c + 1 : c
      const nextPhase: PomodoroPhase = phase === 'focus'
        ? (newCount % 4 === 0 ? 'long_break' : 'short_break')
        : 'focus'
      setPhase(nextPhase)
      setPomodoroTime(POMODORO_DURATIONS[nextPhase])
      return newCount
    })
    if (phase === 'focus') saveSession(POMODORO_DURATIONS.focus / 60, 'pomodoro')
  }

  const saveSessionMutation = useMutation({
    mutationFn: async ({ minutes, type }: { minutes: number; type: 'pomodoro' | 'stopwatch' | 'manual' }) => {
      if (minutes < 1) return
      await (supabase as any).from('study_sessions').insert({
        user_id: user!.id,
        duration_minutes: minutes,
        session_type: type as 'pomodoro' | 'manual' | 'stopwatch',
        date: format(new Date(), 'yyyy-MM-dd'),
        started_at: sessionStartRef.current?.toISOString() || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })
      sessionStartRef.current = null
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly-chart'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const saveSession = (minutes: number, type: 'pomodoro' | 'stopwatch' | 'manual') => {
    saveSessionMutation.mutate({ minutes, type })
  }

  const handleSaveStopwatch = () => {
    const minutes = Math.floor(stopwatchTime / 60)
    saveSession(minutes, 'stopwatch')
    setStopwatchTime(0)
    setStopwatchRunning(false)
    sessionStartRef.current = null
  }

  const handleModeSwitch = (m: TimerMode) => {
    clearInterval(intervalRef.current)
    setPomodoroRunning(false)
    setStopwatchRunning(false)
    setCountdownRunning(false)
    sessionStartRef.current = null
    setMode(m)
  }

  // Progress calculation
  const getProgress = () => {
    if (mode === 'pomodoro') {
      const total = POMODORO_DURATIONS[phase]
      return (total - pomodoroTime) / total
    }
    if (mode === 'countdown') {
      return countdownTotal > 0 ? (countdownTotal - countdownTime) / countdownTotal : 0
    }
    return 0
  }

  const progress = getProgress()
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const currentColor = mode === 'pomodoro' ? phaseColors[phase] : mode === 'countdown' ? '#06B6D4' : '#10B981'
  const isRunning = mode === 'pomodoro' ? pomodoroRunning : mode === 'stopwatch' ? stopwatchRunning : countdownRunning
  const displayTime = mode === 'pomodoro' ? pomodoroTime : mode === 'stopwatch' ? stopwatchTime : countdownTime

  const handlePlayPause = () => {
    if (mode === 'pomodoro') setPomodoroRunning((r) => !r)
    if (mode === 'stopwatch') setStopwatchRunning((r) => !r)
    if (mode === 'countdown') setCountdownRunning((r) => !r)
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    sessionStartRef.current = null
    if (mode === 'pomodoro') { setPomodoroRunning(false); setPomodoroTime(POMODORO_DURATIONS[phase]) }
    if (mode === 'stopwatch') { setStopwatchRunning(false); setStopwatchTime(0) }
    if (mode === 'countdown') {
      setCountdownRunning(false)
      const total = countdownInput.h * 3600 + countdownInput.m * 60 + countdownInput.s
      setCountdownTotal(total)
      setCountdownTime(total)
    }
  }

  const applyCountdown = () => {
    const total = countdownInput.h * 3600 + countdownInput.m * 60 + countdownInput.s
    setCountdownTotal(total)
    setCountdownTime(total)
    setCountdownRunning(false)
  }

  return (
    <div className="page-content max-w-2xl mx-auto">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeUpItem}>
          <h1 className="text-2xl font-bold text-white/95 mb-1">Timer</h1>
          <p className="text-sm text-white/35">Stay focused, track your sessions</p>
        </motion.div>

        {/* Mode selector */}
        <motion.div variants={fadeUpItem}>
          <div className="flex bg-white/[0.04] rounded-xl p-1 max-w-xs">
            {(['pomodoro', 'stopwatch', 'countdown'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200',
                  mode === m ? 'bg-white/[0.09] text-white/90' : 'text-white/35 hover:text-white/60'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Timer ring */}
        <motion.div variants={fadeUpItem} className="flex flex-col items-center">
          <div className="relative">
            {/* Ambient glow */}
            <AnimatePresence>
              {isRunning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 rounded-full blur-3xl"
                  style={{ background: `${currentColor}18` }}
                />
              )}
            </AnimatePresence>

            <svg width="280" height="280" className="-rotate-90">
              {/* Track */}
              <circle
                cx="140" cy="140" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              {/* Progress */}
              <motion.circle
                cx="140" cy="140" r={radius}
                fill="none"
                stroke={currentColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'linear' }}
                style={{ filter: `drop-shadow(0 0 8px ${currentColor}60)` }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {mode === 'pomodoro' && (
                <p className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">
                  {phaseLabels[phase]}
                </p>
              )}
              <span className="text-5xl font-bold text-white/95 tabular-nums font-mono tracking-tight">
                {formatTime(displayTime)}
              </span>
              {mode === 'pomodoro' && (
                <div className="flex items-center gap-1.5 mt-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300',
                        i < (pomodoroCount % 4)
                          ? 'bg-blue-500 scale-110'
                          : 'bg-white/10'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleReset}
              className="p-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              <RotateCcw size={20} />
            </button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePlayPause}
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center font-semibold transition-all duration-200',
                isRunning
                  ? 'bg-white/[0.08] border border-white/10 text-white/80'
                  : 'text-white shadow-glow-blue'
              )}
              style={!isRunning ? { background: `linear-gradient(135deg, ${currentColor}, ${currentColor}cc)` } : {}}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </motion.button>

            {mode === 'pomodoro' && (
              <button
                onClick={handlePomodoroComplete}
                className="p-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
              >
                <SkipForward size={20} />
              </button>
            )}

            {mode === 'stopwatch' && stopwatchTime > 0 && (
              <button
                onClick={handleSaveStopwatch}
                className="p-3 rounded-xl text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Save session"
              >
                <Save size={20} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Countdown custom time input */}
        <AnimatePresence>
          {mode === 'countdown' && (
            <motion.div
              variants={fadeUpItem}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              className="card-premium p-5"
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Set Duration</p>
              <div className="flex items-center gap-4 justify-center">
                {(['h', 'm', 's'] as const).map((unit, i) => (
                  <div key={unit} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => setCountdownInput((prev) => ({ ...prev, [unit]: Math.min(unit === 'h' ? 23 : 59, prev[unit] + 1) }))}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                    >
                      <Plus size={14} />
                    </button>
                    <div className="w-14 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <span className="text-xl font-bold text-white/90 tabular-nums font-mono">
                        {String(countdownInput[unit]).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={() => setCountdownInput((prev) => ({ ...prev, [unit]: Math.max(0, prev[unit] - 1) }))}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[10px] text-white/25 uppercase">{unit}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={applyCountdown}
                className="w-full mt-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white/80 text-sm font-medium transition-all"
              >
                Apply
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pomodoro settings */}
        <AnimatePresence>
          {mode === 'pomodoro' && (
            <motion.div
              variants={fadeUpItem}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="card-premium p-5"
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Session Info</p>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { phase: 'focus', label: 'Focus', time: '25 min', color: 'text-blue-400', activeBg: 'bg-blue-500/10 border-blue-500/20' },
                  { phase: 'short_break', label: 'Short Break', time: '5 min', color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { phase: 'long_break', label: 'Long Break', time: '15 min', color: 'text-purple-400', activeBg: 'bg-purple-500/10 border-purple-500/20' },
                ] as const).map((p) => (
                  <div
                    key={p.phase}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all duration-200',
                      phase === p.phase
                        ? `${p.activeBg} border-opacity-100`
                        : 'border-white/[0.05] bg-transparent'
                    )}
                  >
                    <p className={cn('text-sm font-semibold', phase === p.phase ? p.color : 'text-white/30')}>{p.label}</p>
                    <p className="text-xs text-white/25 mt-0.5">{p.time}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-sm text-white/40">Completed pomodoros</span>
                <span className="text-sm font-bold text-white/80 tabular-nums">{pomodoroCount}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
