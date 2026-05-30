'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { getLast7Days, getDayName } from '@/lib/utils/dates'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1535] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white/50 text-xs mb-0.5">{label}</p>
        <p className="text-white/90 text-sm font-semibold">
          {payload[0].value}h study
        </p>
      </div>
    )
  }
  return null
}

export function WeeklyChart() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const days = getLast7Days()

  const { data: chartData = [] } = useQuery({
    queryKey: ['weekly-chart', user?.id],
    queryFn: async () => {
      const startDate = format(days[0], 'yyyy-MM-dd')
      const endDate = format(days[days.length - 1], 'yyyy-MM-dd')

      const { data } = await supabase
        .from('study_sessions')
        .select('date, duration_minutes')
        .eq('user_id', user!.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const sessionsByDay = new Map<string, number>()
      for (const s of (data || []) as { date: string; duration_minutes: number }[]) {
        const existing = sessionsByDay.get(s.date) || 0
        sessionsByDay.set(s.date, existing + s.duration_minutes)
      }

      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const minutes = sessionsByDay.get(dateStr) || 0
        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
        return {
          day: getDayName(day),
          hours: Math.round((minutes / 60) * 10) / 10,
          isToday,
        }
      })
    },
    enabled: !!user?.id,
  })

  const maxHours = Math.max(...chartData.map((d) => d.hours), 1)
  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0)

  return (
    <div className="card-premium p-6">
      <div className="section-header">
        <div className="flex items-center gap-2.5">
          <BarChart3 size={18} className="text-cyan-400" />
          <h2 className="section-title">This Week</h2>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white/90 tabular-nums">
            {totalHours.toFixed(1)}h
          </p>
          <p className="text-xs text-white/30">total study</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isToday
                    ? 'url(#todayGrad)'
                    : entry.hours > 0
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)'
                  }
                />
              ))}
            </Bar>
            <defs>
              <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
