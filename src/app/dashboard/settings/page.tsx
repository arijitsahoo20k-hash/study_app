'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Bell, Target, LogOut, Save, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { staggerContainer, fadeUpItem } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/cn'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [saved, setSaved] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      return data
    },
    enabled: !!user?.id,
  })

  const [form, setForm] = useState({
    full_name: '',
    timezone: 'Asia/Kolkata',
    study_goal_minutes: 300,
  })

  // Sync form with profile data
  const profileLoaded = !!profile
  const typedProfile = profile as { full_name: string | null; timezone: string; study_goal_minutes: number } | null
  if (profileLoaded && form.full_name === '' && typedProfile?.full_name) {
    setForm({
      full_name: typedProfile.full_name || '',
      timezone: typedProfile.timezone || 'Asia/Kolkata',
      study_goal_minutes: typedProfile.study_goal_minutes || 300,
    })
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('profiles').update({
        full_name: form.full_name,
        timezone: form.timezone,
        study_goal_minutes: form.study_goal_minutes,
        updated_at: new Date().toISOString(),
      } as { full_name: string; timezone: string; study_goal_minutes: number; updated_at: string }).eq('id', user!.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const goalHours = Math.floor(form.study_goal_minutes / 60)
  const goalMins = form.study_goal_minutes % 60

  return (
    <div className="page-content max-w-2xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUpItem}>
          <h1 className="text-2xl font-bold text-white/95 mb-1">Settings</h1>
          <p className="text-sm text-white/35">Manage your account and preferences</p>
        </motion.div>

        {/* Profile section */}
        <motion.div variants={fadeUpItem} className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <User size={17} className="text-blue-400" />
            <h2 className="section-title">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Full name</label>
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Your name"
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className="input-premium opacity-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="input-premium"
              >
                {[
                  'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai',
                  'Europe/London', 'Europe/Paris', 'America/New_York',
                  'America/Los_Angeles', 'America/Chicago', 'Australia/Sydney',
                ].map((tz) => (
                  <option key={tz} value={tz} className="bg-[#0d1535]">{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Study goals */}
        <motion.div variants={fadeUpItem} className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Target size={17} className="text-purple-400" />
            <h2 className="section-title">Study Goals</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-3">
              Daily study goal: <span className="text-white/70">{goalHours}h {goalMins > 0 ? `${goalMins}m` : ''}</span>
            </label>
            <input
              type="range"
              min={30}
              max={720}
              step={30}
              value={form.study_goal_minutes}
              onChange={(e) => set('study_goal_minutes', Number(e.target.value))}
              className="w-full accent-purple-500 mb-2"
            />
            <div className="flex justify-between text-[10px] text-white/20">
              <span>30 min</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 mt-4">
            {[
              { label: '2h', value: 120 },
              { label: '4h', value: 240 },
              { label: '6h', value: 360 },
              { label: '8h', value: 480 },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => set('study_goal_minutes', preset.value)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  form.study_goal_minutes === preset.value
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    : 'border-white/[0.07] text-white/30 hover:border-white/20'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Save button */}
        <motion.div variants={fadeUpItem}>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {updateMutation.isPending
              ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
              : saved
              ? '✓ Saved!'
              : <><Save size={16} /> Save changes</>
            }
          </button>
        </motion.div>

        {/* Danger zone */}
        <motion.div variants={fadeUpItem} className="card-premium p-6 border-red-500/10">
          <h2 className="text-sm font-semibold text-red-400/70 mb-4">Account</h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
