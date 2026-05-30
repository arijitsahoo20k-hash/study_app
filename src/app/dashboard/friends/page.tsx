'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Search, Clock, CheckSquare, TrendingUp, X, Loader2, Mail } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem, modalVariants, backdropVariants } from '@/lib/utils/animations'
import { formatDuration } from '@/lib/utils/dates'
import { format } from 'date-fns'

interface FriendProfile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  streak_count: number
  total_study_minutes: number
  today_minutes?: number
  tasks_today?: number
}

function FriendCard({ friend }: { friend: FriendProfile }) {
  const initials = friend.full_name
    ? friend.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : friend.email.slice(0, 2).toUpperCase()

  const isActive = (friend.today_minutes || 0) > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5 group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white/70">
            {initials}
          </div>
          {/* Online indicator */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050816]',
            isActive ? 'bg-emerald-400' : 'bg-white/20'
          )} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 truncate">
            {friend.full_name || friend.email.split('@')[0]}
          </p>
          <p className="text-xs text-white/30 truncate">{friend.email}</p>

          {/* Activity */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-blue-400/70" />
              <span className="text-xs text-white/45">
                {friend.today_minutes ? formatDuration(friend.today_minutes) : '0m'} today
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckSquare size={11} className="text-emerald-400/70" />
              <span className="text-xs text-white/45">
                {friend.tasks_today || 0} tasks
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🔥</span>
              <span className="text-xs text-white/45">{friend.streak_count}d streak</span>
            </div>
          </div>
        </div>

        {/* Total study */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white/70 tabular-nums">
            {Math.floor((friend.total_study_minutes || 0) / 60)}h
          </p>
          <p className="text-[10px] text-white/25">total</p>
        </div>
      </div>

      {/* Today's progress bar */}
      {(friend.today_minutes || 0) > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/30">Today's activity</span>
            <span className="text-[10px] text-emerald-400/70">
              {formatDuration(friend.today_minutes || 0)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((friend.today_minutes || 0) / 300) * 100)}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function AddFriendModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Find user by email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (!profiles) throw new Error('No user found with that email')
      const typedProfile = profiles as { id: string; email: string; full_name: string | null }
      if (typedProfile.id === user?.id) throw new Error("You can't add yourself")

      // Check if already friends
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', user!.id)
        .eq('friend_id', typedProfile.id)
        .single()

      if (existing) throw new Error('Friend request already sent')

      // Create friendship
      await (supabase as any).from('friendships').insert({
        user_id: user!.id,
        friend_id: typedProfile.id,
        status: 'accepted' as const,
      })

      qc.invalidateQueries({ queryKey: ['friends', user?.id] })
      setSuccess(`Friend request sent to ${typedProfile.full_name || email}!`)
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm card-premium p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white/90">Add Friend</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="mb-5 p-4 rounded-xl bg-blue-500/[0.07] border border-blue-500/20">
            <p className="text-xs text-blue-300/80 leading-relaxed">
              Add friends to see their study hours and tasks. This helps with accountability and motivation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Friend's email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="input-premium pl-9"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400/80 text-xs">
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-emerald-400/80 text-xs">
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Send Request
            </button>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function FriendsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted')

      if (!friendships?.length) return []

      const friendIds = (friendships as { friend_id: string }[]).map((f) => f.friend_id)

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, streak_count, total_study_minutes')
        .in('id', friendIds)

      if (!profiles?.length) return []

      // Get today's study minutes for each friend
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('user_id, duration_minutes')
        .in('user_id', friendIds)
        .eq('date', today)

      // Get today's completed tasks for each friend
      const { data: tasks } = await supabase
        .from('todos')
        .select('user_id')
        .in('user_id', friendIds)
        .eq('status', 'done')
        .gte('completed_at', `${today}T00:00:00`)

      // Aggregate
      const todayMinutes = new Map<string, number>()
      const todayTasks = new Map<string, number>()

      for (const s of (sessions || []) as { user_id: string; duration_minutes: number }[]) {
        todayMinutes.set(s.user_id, (todayMinutes.get(s.user_id) || 0) + s.duration_minutes)
      }
      for (const t of (tasks || []) as { user_id: string }[]) {
        todayTasks.set(t.user_id, (todayTasks.get(t.user_id) || 0) + 1)
      }

      const typedProfiles = profiles as { id: string; full_name: string | null; email: string; avatar_url: string | null; streak_count: number; total_study_minutes: number }[]
      return typedProfiles.map((p) => ({
        ...p,
        today_minutes: todayMinutes.get(p.id) || 0,
        tasks_today: todayTasks.get(p.id) || 0,
      })) as FriendProfile[]
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  })

  const filtered = friends.filter((f) => {
    if (!search) return true
    const name = f.full_name || f.email
    return name.toLowerCase().includes(search.toLowerCase())
  })

  // Sort: active first, then by today's study time
  const sorted = [...filtered].sort((a, b) => (b.today_minutes || 0) - (a.today_minutes || 0))

  const totalFriendsStudyingToday = friends.filter((f) => (f.today_minutes || 0) > 0).length

  return (
    <div className="page-content max-w-3xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUpItem} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/95 mb-1">Study Circle</h1>
            <p className="text-sm text-white/35">
              {friends.length} friends · {totalFriendsStudyingToday} studying now
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-blue"
          >
            <UserPlus size={16} /> Add friend
          </button>
        </motion.div>

        {/* Activity summary */}
        {friends.length > 0 && (
          <motion.div variants={fadeUpItem} className="card-premium p-5">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Today's Leaderboard</p>
            <div className="space-y-3">
              {sorted.slice(0, 5).map((f, i) => {
                const initials = f.full_name
                  ? f.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : f.email.slice(0, 2).toUpperCase()
                const maxMinutes = Math.max(...sorted.map((s) => s.today_minutes || 0), 1)

                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className="text-xs text-white/20 w-4 text-right tabular-nums">{i + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.07] flex items-center justify-center text-[10px] font-bold text-white/60 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/65 truncate">{f.full_name || f.email.split('@')[0]}</span>
                        <span className="text-xs font-semibold text-white/50 tabular-nums ml-2">
                          {formatDuration(f.today_minutes || 0)}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((f.today_minutes || 0) / maxMinutes) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Search */}
        {friends.length > 0 && (
          <motion.div variants={fadeUpItem} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends…"
              className="input-premium pl-9"
            />
          </motion.div>
        )}

        {/* Friends list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div variants={fadeUpItem} className="text-center py-20">
            <Users size={48} className="text-white/[0.06] mx-auto mb-4" />
            <p className="text-white/25 text-sm mb-1">No friends yet</p>
            <p className="text-white/15 text-xs mb-4">Add friends to stay accountable together</p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold mx-auto transition-all"
            >
              <UserPlus size={15} /> Add your first friend
            </button>
          </motion.div>
        ) : (
          <motion.div variants={fadeUpItem} className="space-y-3">
            {sorted.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAdd && <AddFriendModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  )
}
