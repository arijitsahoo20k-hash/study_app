'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { getCountdown } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Exam } from '@/types/database'

function urgencyColor(days: number) {
  if (days <= 3) return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (days <= 7) return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  if (days <= 14) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
}

export function UpcomingExams() {
  const { user } = useAuthStore()
  const supabase = createClient()

  const { data: exams = [] } = useQuery({
    queryKey: ['exams-upcoming', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user!.id)
        .gte('exam_date', new Date().toISOString())
        .order('exam_date')
        .limit(3)
      return data as Exam[]
    },
    enabled: !!user?.id,
  })

  return (
    <div className="card-premium p-6">
      <div className="section-header">
        <div className="flex items-center gap-2.5">
          <Zap size={18} className="text-orange-400" />
          <h2 className="section-title">Upcoming Exams</h2>
        </div>
        <Link
          href="/dashboard/exams"
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          All <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {exams.length === 0 ? (
          <p className="text-white/25 text-sm text-center py-4">No upcoming exams</p>
        ) : (
          exams.map((exam, i) => {
            const { days, hours } = getCountdown(exam.exam_date)
            const colorClass = urgencyColor(days)
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{exam.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{exam.subject}</p>
                </div>
                <div className={cn('badge border ml-3 flex-shrink-0', colorClass)}>
                  {days > 0 ? `${days}d` : `${hours}h`}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
