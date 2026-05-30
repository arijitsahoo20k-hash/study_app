'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Search, CheckCircle, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { timeAgo } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem, modalVariants, backdropVariants } from '@/lib/utils/animations'
import type { Mistake, MistakeCategory } from '@/types/database'

const categories: { value: MistakeCategory; label: string; color: string }[] = [
  { value: 'concept', label: 'Concept', color: 'badge-purple' },
  { value: 'calculation', label: 'Calculation', color: 'badge-blue' },
  { value: 'careless', label: 'Careless', color: 'badge-amber' },
  { value: 'time', label: 'Time Mgmt', color: 'badge-cyan' },
  { value: 'other', label: 'Other', color: 'badge-green' },
]

const severityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

function MistakeCard({ mistake, onUpdate }: { mistake: Mistake; onUpdate: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  const toggleRevised = async () => {
    await (supabase as any).from('mistakes').update({ is_revised: !mistake.is_revised } as { is_revised: boolean }).eq('id', mistake.id)
    onUpdate()
  }

  const deleteMistake = async () => {
    await supabase.from('mistakes').delete().eq('id', mistake.id)
    onUpdate()
  }

  const cat = categories.find((c) => c.value === mistake.category)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'card-premium overflow-hidden transition-all duration-200',
        mistake.is_revised && 'opacity-60'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Revised toggle */}
          <button
            onClick={toggleRevised}
            className="mt-0.5 flex-shrink-0"
          >
            {mistake.is_revised
              ? <CheckCircle size={18} className="text-emerald-400" />
              : <Circle size={18} className="text-white/20 hover:text-white/50 transition-colors" />
            }
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-white/85">{mistake.subject}</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-xs text-white/50">{mistake.topic}</span>
              {cat && <span className={cn('badge text-[10px]', cat.color)}>{cat.label}</span>}
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', severityColors[mistake.severity])} />
            </div>
            <p className={cn(
              'text-sm text-white/65 leading-relaxed',
              mistake.is_revised && 'line-through text-white/30'
            )}>
              {mistake.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-white/20">{timeAgo(mistake.created_at)}</span>
              {mistake.next_revision && (
                <span className="text-[10px] text-purple-400/70">
                  Revise: {new Date(mistake.next_revision).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={deleteMistake}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (mistake.root_cause || mistake.fix) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mistake.root_cause && (
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Root Cause</p>
                  <p className="text-xs text-white/55 leading-relaxed">{mistake.root_cause}</p>
                </div>
              )}
              {mistake.fix && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-wider mb-1.5">Fix / Solution</p>
                  <p className="text-xs text-white/55 leading-relaxed">{mistake.fix}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AddMistakeModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    subject: '', topic: '', description: '',
    root_cause: '', fix: '',
    category: 'concept' as MistakeCategory,
    severity: 'medium' as 'low' | 'medium' | 'high',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await (supabase as any).from('mistakes').insert({
      user_id: user!.id,
      ...form,
      is_revised: false,
      tags: [] as string[],
      next_revision: new Date(Date.now() + 3 * 86400000).toISOString(),
    })
    qc.invalidateQueries({ queryKey: ['mistakes', user?.id] })
    onClose()
  }

  return (
    <>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg card-premium p-6 my-4" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-base font-semibold text-white/90 mb-5">Log Mistake</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Subject</label>
                <input value={form.subject} onChange={(e) => set('subject', e.target.value)}
                  placeholder="e.g. Mathematics" className="input-premium" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Topic</label>
                <input value={form.topic} onChange={(e) => set('topic', e.target.value)}
                  placeholder="e.g. Integration" className="input-premium" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">What went wrong?</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the mistake…" className="input-premium resize-none h-20" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Root cause (optional)</label>
              <input value={form.root_cause} onChange={(e) => set('root_cause', e.target.value)}
                placeholder="Why did this happen?" className="input-premium" />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Fix / Solution (optional)</label>
              <input value={form.fix} onChange={(e) => set('fix', e.target.value)}
                placeholder="How to avoid this next time?" className="input-premium" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button key={c.value} type="button" onClick={() => set('category', c.value)}
                      className={cn('badge border text-[10px] cursor-pointer transition-all',
                        form.category === c.value ? c.color : 'border-white/10 text-white/30'
                      )}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2">Severity</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((s) => (
                    <button key={s} type="button" onClick={() => set('severity', s)}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all',
                        form.severity === s
                          ? s === 'high' ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : s === 'medium' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                            : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'border-white/[0.07] text-white/30'
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-sm font-medium transition-all hover:bg-white/[0.07]">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                Log Mistake
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function MistakesPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<MistakeCategory | 'all'>('all')
  const [showRevised, setShowRevised] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const { data: mistakes = [], isLoading } = useQuery({
    queryKey: ['mistakes', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mistakes').select('*')
        .eq('user_id', user!.id).order('created_at', { ascending: false })
      return data as Mistake[]
    },
    enabled: !!user?.id,
  })

  const filtered = mistakes.filter((m) => {
    if (!showRevised && m.is_revised) return false
    if (catFilter !== 'all' && m.category !== catFilter) return false
    if (search && !m.subject.toLowerCase().includes(search.toLowerCase()) &&
        !m.topic.toLowerCase().includes(search.toLowerCase()) &&
        !m.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pending = mistakes.filter((m) => !m.is_revised).length
  const revised = mistakes.filter((m) => m.is_revised).length

  return (
    <div className="page-content max-w-3xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUpItem} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/95 mb-1">Mistake Log</h1>
            <p className="text-sm text-white/35">{pending} pending revision · {revised} revised</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-blue">
            <Plus size={16} /> Log mistake
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUpItem} className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const count = mistakes.filter((m) => m.category === cat.value).length
            return (
              <button key={cat.value} onClick={() => setCatFilter(catFilter === cat.value ? 'all' : cat.value)}
                className={cn(
                  'p-3 rounded-xl border text-center transition-all duration-200',
                  catFilter === cat.value
                    ? 'border-white/15 bg-white/[0.06]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                )}>
                <p className="text-lg font-bold text-white/80 tabular-nums">{count}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{cat.label}</p>
              </button>
            )
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUpItem} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mistakes…" className="input-premium pl-9" />
          </div>
          <button onClick={() => setShowRevised(!showRevised)}
            className={cn(
              'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
              showRevised ? 'bg-white/[0.07] border-white/15 text-white/70' : 'border-white/[0.07] text-white/30 hover:border-white/15'
            )}>
            Show revised
          </button>
        </motion.div>

        {/* Mistakes list */}
        <motion.div variants={fadeUpItem} className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/25 text-sm mb-2">No mistakes logged yet</p>
              <p className="text-white/15 text-xs">Track what you get wrong to improve faster</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((mistake) => (
                <MistakeCard
                  key={mistake.id}
                  mistake={mistake}
                  onUpdate={() => qc.invalidateQueries({ queryKey: ['mistakes', user?.id] })}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showAdd && <AddMistakeModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  )
}
