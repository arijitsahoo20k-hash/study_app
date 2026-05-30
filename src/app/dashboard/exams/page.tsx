'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus, Trash2, Edit2, X, Calendar, BookOpen } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { getCountdown } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem, modalVariants, backdropVariants } from '@/lib/utils/animations'
import type { Exam } from '@/types/database'

const examColors = [
  '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#6366F1',
]

function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate))

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(targetDate)), 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (countdown.total <= 0) {
    return <span className="text-red-400 text-sm font-semibold">Exam day!</span>
  }

  const units = [
    { label: 'D', value: countdown.days },
    { label: 'H', value: countdown.hours },
    { label: 'M', value: countdown.minutes },
    { label: 'S', value: countdown.seconds },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/[0.08] flex items-center justify-center">
            <span className="text-sm font-bold text-white/90 tabular-nums font-mono">
              {String(value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] text-white/25 mt-0.5 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  )
}

function ExamCard({ exam, onDelete, onEdit }: {
  exam: Exam
  onDelete: () => void
  onEdit: () => void
}) {
  const { days } = getCountdown(exam.exam_date)

  const urgency = days <= 3 ? 'critical' : days <= 7 ? 'high' : days <= 14 ? 'medium' : 'low'
  const urgencyGlow: Record<string, string> = {
    critical: `0 0 30px ${exam.color}40, 0 0 60px ${exam.color}15`,
    high: `0 0 20px ${exam.color}25`,
    medium: `0 0 15px ${exam.color}15`,
    low: 'none',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="card-premium overflow-hidden group cursor-default"
      style={{ boxShadow: urgencyGlow[urgency] }}
    >
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${exam.color}, ${exam.color}80)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="badge text-[10px] border"
                style={{ color: exam.color, background: `${exam.color}15`, borderColor: `${exam.color}30` }}
              >
                {exam.subject}
              </span>
              {urgency === 'critical' && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="badge bg-red-500/15 border-red-500/30 text-red-400 text-[10px]"
                >
                  ⚡ Urgent
                </motion.span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white/90 truncate">{exam.title}</h3>
            <p className="text-xs text-white/35 mt-0.5 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(exam.exam_date).toLocaleDateString('en', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Countdown */}
        <CountdownDisplay targetDate={exam.exam_date} />

        {/* Prep status */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/35">Preparation</span>
            <span className="text-xs font-semibold" style={{ color: exam.color }}>{exam.prep_status}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${exam.prep_status}%` }}
              transition={{ duration: 1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: `linear-gradient(90deg, ${exam.color}cc, ${exam.color})` }}
            />
          </div>
        </div>

        {/* Syllabus chips */}
        {exam.syllabus?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {exam.syllabus.slice(0, 4).map((item, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ color: `${exam.color}cc`, borderColor: `${exam.color}25`, background: `${exam.color}08` }}
              >
                {item}
              </span>
            ))}
            {exam.syllabus.length > 4 && (
              <span className="text-[10px] text-white/25">+{exam.syllabus.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function AddExamModal({ exam, onClose }: { exam?: Exam | null; onClose: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title: exam?.title || '',
    subject: exam?.subject || '',
    exam_date: exam?.exam_date ? exam.exam_date.slice(0, 16) : '',
    prep_status: exam?.prep_status || 0,
    notes: exam?.notes || '',
    color: exam?.color || examColors[0],
    syllabus_text: exam?.syllabus?.join(', ') || '',
  })

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const syllabus = form.syllabus_text.split(',').map((s) => s.trim()).filter(Boolean)
    const payload = {
      user_id: user!.id,
      title: form.title,
      subject: form.subject,
      exam_date: new Date(form.exam_date).toISOString(),
      prep_status: form.prep_status,
      notes: form.notes || null,
      color: form.color,
      syllabus,
    }
    if (exam) {
      await (supabase as any).from('exams').update(payload as any).eq('id', exam.id)
    } else {
      await (supabase as any).from('exams').insert(payload as any)
    }
    qc.invalidateQueries({ queryKey: ['exams'] })
    qc.invalidateQueries({ queryKey: ['exams-upcoming'] })
    onClose()
  }

  return (
    <>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md card-premium p-6 my-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white/90">{exam ? 'Edit Exam' : 'Add Exam'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Exam title</label>
                <input value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Final Exam" className="input-premium" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Subject</label>
                <input value={form.subject} onChange={(e) => set('subject', e.target.value)}
                  placeholder="e.g. Physics" className="input-premium" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Exam date & time</label>
              <input type="datetime-local" value={form.exam_date} onChange={(e) => set('exam_date', e.target.value)}
                className="input-premium" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">
                Preparation: <span className="text-white/70">{form.prep_status}%</span>
              </label>
              <input type="range" min={0} max={100} value={form.prep_status}
                onChange={(e) => set('prep_status', Number(e.target.value))}
                className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Syllabus topics (comma-separated)</label>
              <input value={form.syllabus_text} onChange={(e) => set('syllabus_text', e.target.value)}
                placeholder="Integration, Differentiation, Limits…" className="input-premium" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {examColors.map((c) => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      form.color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-sm font-medium hover:bg-white/[0.07] transition-all">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                {exam ? 'Save Changes' : 'Add Exam'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function ExamsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editExam, setEditExam] = useState<Exam | null>(null)

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('exams').select('*')
        .eq('user_id', user!.id).order('exam_date')
      return data as Exam[]
    },
    enabled: !!user?.id,
  })

  const deleteExam = async (id: string) => {
    await supabase.from('exams').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['exams', user?.id] })
    qc.invalidateQueries({ queryKey: ['exams-upcoming', user?.id] })
  }

  const upcoming = exams.filter((e) => new Date(e.exam_date) > new Date())
  const past = exams.filter((e) => new Date(e.exam_date) <= new Date())

  return (
    <div className="page-content max-w-5xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeUpItem} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/95 mb-1">Exams</h1>
            <p className="text-sm text-white/35">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-blue">
            <Plus size={16} /> Add exam
          </button>
        </motion.div>

        {/* Upcoming exams */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <motion.div variants={fadeUpItem} className="text-center py-20">
            <Zap size={48} className="text-white/[0.06] mx-auto mb-4" />
            <p className="text-white/25 text-sm mb-2">No upcoming exams</p>
            <button onClick={() => setShowAdd(true)}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Schedule your first exam
            </button>
          </motion.div>
        ) : (
          <motion.div variants={fadeUpItem}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Upcoming</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {upcoming.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    onDelete={() => deleteExam(exam.id)}
                    onEdit={() => setEditExam(exam)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Past exams */}
        {past.length > 0 && (
          <motion.div variants={fadeUpItem}>
            <p className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Past</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {past.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onDelete={() => deleteExam(exam.id)}
                  onEdit={() => setEditExam(exam)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {(showAdd || editExam) && (
          <AddExamModal
            exam={editExam}
            onClose={() => { setShowAdd(false); setEditExam(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
