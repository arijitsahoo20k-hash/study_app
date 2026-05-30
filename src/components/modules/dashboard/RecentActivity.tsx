'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { timeAgo } from '@/lib/utils/dates'
import { Clock, CheckSquare, BookOpen, FileText } from 'lucide-react'

export function RecentActivity() {
  const { user } = useAuthStore()
  const supabase = createClient()

  const { data: sessions = [] } = useQuery({
    queryKey: ['recent-sessions', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(4)
      return (data || []) as { id: string; duration_minutes: number; session_type: string; created_at: string }[]
    },
    enabled: !!user?.id,
  })

  return (
    <div className="card-premium p-6">
      <h2 className="section-title mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-white/25 text-sm text-center py-3">No recent activity</p>
        ) : (
          sessions.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Clock size={13} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/65 truncate">
                  Studied {s.duration_minutes} min
                  {s.session_type === 'pomodoro' ? ' (Pomodoro)' : ''}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(s.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
