'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, Calendar, Flag, MoreHorizontal } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils/cn'
import type { Todo } from '@/types/database'

const priorityDot: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

export function TodoCard({ todo, onUpdate }: { todo: Todo; onUpdate: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [showMenu, setShowMenu] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const newStatus = todo.status === 'done' ? 'todo' : 'done'
      await (supabase as any)
        .from('todos')
        .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
        .eq('id', todo.id)
    },
    onSuccess: onUpdate,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('todos').delete().eq('id', todo.id)
    },
    onSuccess: onUpdate,
  })

  const isDone = todo.status === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      className={cn(
        'group flex items-center gap-3 p-3.5 rounded-xl border border-transparent',
        'bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/[0.05]',
        'transition-all duration-200',
        isDone && 'opacity-50'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleMutation.mutate()}
        className={cn(
          'w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200',
          isDone
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-white/20 hover:border-white/50'
        )}
      >
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Check size={11} className="text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Priority dot */}
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDot[todo.priority])} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm text-white/80',
          isDone && 'line-through text-white/30'
        )}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-white/30 mt-0.5 truncate">{todo.description}</p>
        )}
        {todo.due_date && (
          <div className="flex items-center gap-1 mt-1">
            <Calendar size={11} className="text-white/25" />
            <span className="text-[10px] text-white/25">
              {new Date(todo.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {todo.tags?.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {todo.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="badge-blue text-[10px]">{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => deleteMutation.mutate()}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}
