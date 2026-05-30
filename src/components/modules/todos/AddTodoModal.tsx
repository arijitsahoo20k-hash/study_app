'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { modalVariants, backdropVariants } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import type { Priority } from '@/types/database'

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { value: 'low', label: 'Low', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
]

export function AddTodoModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const addMutation = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('todos').insert({
        user_id: user!.id,
        title,
        description: description || null,
        priority,
        status: 'todo' as const,
        due_date: dueDate || null,
        scheduled_date: scheduledDate || null,
        order_index: Date.now(),
        tags: [] as string[],
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos', user?.id] })
      qc.invalidateQueries({ queryKey: ['todos-today', user?.id] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addMutation.mutate()
  }

  return (
    <>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md card-premium p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white/90">New Task</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="input-premium text-base"
                required
              />
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="input-premium resize-none h-20"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-2">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'py-1.5 text-xs font-medium rounded-lg border transition-all duration-200',
                      priority === p.value ? p.color : 'border-white/[0.07] text-white/30 hover:border-white/20'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Schedule for</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-premium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || addMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={16} />
              Add Task
            </button>
          </form>
        </div>
      </motion.div>
    </>
  )
}
