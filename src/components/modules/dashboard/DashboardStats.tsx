'use client'

import { motion } from 'framer-motion'
import { fadeUpItem } from '@/lib/utils/animations'
import { Flame, Clock, CheckSquare, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { todayString } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'

const stats = [
  {
    key: 'streak',
    label: 'Day streak',
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    key: 'todayMinutes',
    label: "Today's hours",
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    key: 'tasksCompleted',
    label: 'Tasks done',
    icon: CheckSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    key: 'weeklyGoal',
    label: 'Weekly goal',
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

export function DashboardStats() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const today = todayString()

  const { data } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const [profileRes, todaySessionsRes, tasksRes, weekSessionsRes] = await Promise.all([
        supabase.from('profiles').select('streak_count, study_goal_minutes').eq('id', user.id).single(),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).eq('date', today),
        supabase.from('todos').select('id').eq('user_id', user.id).eq('status', 'done').gte('completed_at', `${today}T00:00:00`),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
      ])

      const todayMinutes = (todaySessionsRes.data || []).reduce((sum, s) => sum + (s as { duration_minutes: number }).duration_minutes, 0)
      const weekMinutes = (weekSessionsRes.data || []).reduce((sum, s) => sum + (s as { duration_minutes: number }).duration_minutes, 0)
      const goalMinutes = (profileRes.data as { streak_count: number; study_goal_minutes: number } | null)?.study_goal_minutes || 300
      const weeklyGoalPct = Math.min(100, Math.round((weekMinutes / (goalMinutes * 7)) * 100))

      return {
        streak: (profileRes.data as { streak_count: number; study_goal_minutes: number } | null)?.streak_count || 0,
        todayMinutes,
        tasksCompleted: tasksRes.data?.length || 0,
        weeklyGoal: weeklyGoalPct,
      }
    },
    enabled: !!user?.id,
  })

  const values: Record<string, string> = {
    streak: `${data?.streak || 0}`,
    todayMinutes: data?.todayMinutes
      ? `${Math.floor(data.todayMinutes / 60)}h ${data.todayMinutes % 60}m`
      : '0h 0m',
    tasksCompleted: `${data?.tasksCompleted || 0}`,
    weeklyGoal: `${data?.weeklyGoal || 0}%`,
  }

  return (
    <>
      {stats.map((stat) => (
        <motion.div key={stat.key} variants={fadeUpItem}>
          <div className="card-premium p-5 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className={cn('p-2 rounded-lg border', stat.bg, stat.border)}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white/90 mb-1 tabular-nums">
              {values[stat.key]}
            </p>
            <p className="text-xs text-white/35 font-medium">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </>
  )
}
