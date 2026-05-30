'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, ChevronRight, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { todayString } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Todo } from '@/types/database'

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

export function TodayTasks() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const today = todayString()

  const { data: todos = [] } = useQuery({
    queryKey: ['todos-today', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('scheduled_date', today)
        .order('order_index')
        .limit(8)
      return data as Todo[]
    },
    enabled: !!user?.id,
  })

  const toggleMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      const newStatus = todo.status === 'done' ? 'todo' : 'done'
      await (supabase as any)
        .from('todos')
        .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
        .eq('id', todo.id)
    },
    onMutate: async (todo) => {
      await qc.cancelQueries({ queryKey: ['todos-today', user?.id] })
      const prev = qc.getQueryData(['todos-today', user?.id])
      qc.setQueryData(['todos-today', user?.id], (old: Todo[]) =>
        old.map((t) => t.id === todo.id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t
        )
      )
      return { prev }
    },
    onError: (_err, _todo, ctx) => {
      qc.setQueryData(['todos-today', user?.id], ctx?.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['todos-today', user?.id] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats', user?.id] })
    },
  })

  const done = todos.filter((t) => t.status === 'done').length
  const total = todos.length

  return (
    <div className="card-premium p-6">
      <div className="section-header">
        <div className="flex items-center gap-2.5">
          <CheckSquare size={18} className="text-emerald-400" />
          <h2 className="section-title">Today's Tasks</h2>
          {total > 0 && (
            <span className="badge-green text-[11px]">{done}/{total}</span>
          )}
        </div>
        <Link
          href="/dashboard/todos"
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-5">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      )}

      {/* Tasks list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {todos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <p className="text-white/25 text-sm">No tasks scheduled for today</p>
              <Link
                href="/dashboard/todos"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus size={14} /> Add task
              </Link>
            </motion.div>
          ) : (
            todos.map((todo, i) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg group transition-all duration-200',
                  'hover:bg-white/[0.03]',
                  todo.status === 'done' && 'opacity-50'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleMutation.mutate(todo)}
                  className={cn(
                    'w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all duration-200',
                    todo.status === 'done'
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-white/20 hover:border-white/40'
                  )}
                >
                  <AnimatePresence>
                    {todo.status === 'done' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Priority dot */}
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    priorityColors[todo.priority]
                  )}
                />

                {/* Title */}
                <span
                  className={cn(
                    'text-sm text-white/75 flex-1 min-w-0 truncate',
                    todo.status === 'done' && 'line-through text-white/30'
                  )}
                >
                  {todo.title}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
