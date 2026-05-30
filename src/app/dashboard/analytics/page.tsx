'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, Flame, Target, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { getLast30Days, getLast7Days, getDayName, formatShortDate } from '@/lib/utils/dates'
import type { StudySession, Profile, Todo } from '@/types/database'
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from 'recharts'
import { staggerContainer, fadeUpItem } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/cn'

type Range = '7d' | '30d' | '3m'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1535] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-white/40 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
            {p.value}{p.dataKey === 'hours' ? 'h' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [range, setRange] = useState<Range>('7d')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', user?.id, range],
    queryFn: async () => {
      let days: Date[]
      let startDate: string

      if (range === '7d') {
        days = getLast7Days()
        startDate = format(days[0], 'yyyy-MM-dd')
      } else if (range === '30d') {
        days = getLast30Days()
        startDate = format(days[0], 'yyyy-MM-dd')
      } else {
        // 3 months
        const start = startOfMonth(subMonths(new Date(), 2))
        const end = endOfMonth(new Date())
        days = eachDayOfInterval({ start, end })
        startDate = format(start, 'yyyy-MM-dd')
      }

      const endDate = format(days[days.length - 1], 'yyyy-MM-dd')

      const [sessionsRes, todosRes, profileRes] = await Promise.all([
        supabase.from('study_sessions').select('date, duration_minutes, session_type')
          .eq('user_id', user!.id).gte('date', startDate).lte('date', endDate),
        supabase.from('todos').select('completed_at, priority')
          .eq('user_id', user!.id).eq('status', 'done')
          .gte('completed_at', `${startDate}T00:00:00`),
        supabase.from('profiles').select('streak_count, total_study_minutes, study_goal_minutes').eq('id', user!.id).single(),
      ])

      // Build day-by-day data
      const sessionsByDay = new Map<string, number>()
      const tasksByDay = new Map<string, number>()

      for (const s of (sessionsRes.data || []) as { date: string; duration_minutes: number; session_type: string }[]) {
        sessionsByDay.set(s.date, (sessionsByDay.get(s.date) || 0) + s.duration_minutes)
      }
      for (const t of (todosRes.data || []) as { completed_at: string | null; priority: string }[]) {
        const day = t.completed_at?.split('T')[0] || ''
        tasksByDay.set(day, (tasksByDay.get(day) || 0) + 1)
      }

      const chartData = days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const minutes = sessionsByDay.get(dateStr) || 0
        return {
          label: range === '7d' ? getDayName(day) : formatShortDate(day),
          hours: Math.round((minutes / 60) * 10) / 10,
          tasks: tasksByDay.get(dateStr) || 0,
          isToday: dateStr === format(new Date(), 'yyyy-MM-dd'),
        }
      })

      const totalMinutes = (sessionsRes.data || []).reduce((s, r) => s + (r as { date: string; duration_minutes: number; session_type: string }).duration_minutes, 0)
      const totalTasks = todosRes.data?.length || 0
      const avgHoursPerDay = days.length > 0 ? Math.round((totalMinutes / 60 / days.length) * 10) / 10 : 0
      const bestDay = chartData.reduce((best, d) => d.hours > (best?.hours || 0) ? d : best, chartData[0])
      const activeDays = chartData.filter((d) => d.hours > 0).length

      return {
        chartData,
        totalMinutes,
        totalTasks,
        avgHoursPerDay,
        bestDay,
        activeDays,
        totalDays: days.length,
        streak: (profileRes.data as { streak_count: number; study_goal_minutes: number } | null)?.streak_count || 0,
        goalMinutes: (profileRes.data as { streak_count: number; study_goal_minutes: number } | null)?.study_goal_minutes || 300,
      }
    },
    enabled: !!user?.id,
  })

  const statCards = [
    {
      label: 'Total study time',
      value: data ? `${Math.floor(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m` : '—',
      icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    },
    {
      label: 'Daily average',
      value: data ? `${data.avgHoursPerDay}h` : '—',
      icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20',
    },
    {
      label: 'Tasks completed',
      value: data ? String(data.totalTasks) : '—',
      icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    },
    {
      label: 'Active days',
      value: data ? `${data.activeDays}/${data.totalDays}` : '—',
      icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    },
  ]

  return (
    <div className="page-content max-w-5xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUpItem} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/95 mb-1">Analytics</h1>
            <p className="text-sm text-white/35">Your study performance over time</p>
          </div>
          {/* Range selector */}
          <div className="flex bg-white/[0.04] rounded-lg p-1">
            {(['7d', '30d', '3m'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200',
                  range === r ? 'bg-white/[0.08] text-white/90' : 'text-white/35 hover:text-white/60'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={fadeUpItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="card-premium p-5">
              <div className={cn('p-2 rounded-lg border w-fit mb-4', s.bg, s.border)}>
                <s.icon size={17} className={s.color} />
              </div>
              <p className="text-xl font-bold text-white/90 tabular-nums">{s.value}</p>
              <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Main chart - study hours */}
        <motion.div variants={fadeUpItem} className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <BarChart3 size={18} className="text-blue-400" />
              <h2 className="section-title">Study Hours</h2>
            </div>
          </div>
          <div className="h-56">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData || []} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} fill="url(#hoursGrad)" dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Tasks chart + heatmap row */}
        <motion.div variants={fadeUpItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks completed */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <Target size={18} className="text-emerald-400" />
              <h2 className="section-title">Tasks Completed</h2>
            </div>
            <div className="h-44">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chartData || []} barSize={20} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                      {(data?.chartData || []).map((entry, i) => (
                        <Cell key={i} fill={entry.tasks > 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255,255,255,0.04)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary insights */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <TrendingUp size={18} className="text-purple-400" />
              <h2 className="section-title">Insights</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-white/50">Best day</span>
                <span className="text-sm font-semibold text-white/80">
                  {data?.bestDay?.label} · {data?.bestDay?.hours}h
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-white/50">Current streak</span>
                <span className="text-sm font-semibold text-white/80">{data?.streak} 🔥 days</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-white/50">Consistency</span>
                <span className="text-sm font-semibold text-white/80">
                  {data ? Math.round((data.activeDays / data.totalDays) * 100) : 0}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">Daily goal progress</span>
                  <span className="text-xs text-white/30">
                    {data ? Math.round(data.avgHoursPerDay * 60) : 0}/{data?.goalMinutes} min
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{
                      width: data
                        ? `${Math.min(100, (data.avgHoursPerDay * 60 / (data.goalMinutes || 300)) * 100)}%`
                        : '0%'
                    }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
