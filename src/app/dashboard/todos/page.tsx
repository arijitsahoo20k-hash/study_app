'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, Search, Filter, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { TodoCard } from '@/components/modules/todos/TodoCard'
import { AddTodoModal } from '@/components/modules/todos/AddTodoModal'
import { staggerContainer, fadeUpItem } from '@/lib/utils/animations'
import { format } from 'date-fns'
import type { Todo } from '@/types/database'
import { cn } from '@/lib/utils/cn'

type FilterType = 'all' | 'today' | 'todo' | 'done'
type PriorityFilter = 'all' | 'urgent' | 'high' | 'medium' | 'low'

export default function TodosPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<FilterType>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos', user?.id],
    queryFn: async () => {
      let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', user!.id)
        .order('order_index')
        .order('created_at', { ascending: false })

      const { data } = await query
      return data as Todo[]
    },
    enabled: !!user?.id,
  })

  const filtered = todos.filter((t) => {
    if (filter === 'today' && t.scheduled_date !== today) return false
    if (filter === 'todo' && t.status === 'done') return false
    if (filter === 'done' && t.status !== 'done') return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = {
    urgent: filtered.filter((t) => t.priority === 'urgent' && t.status !== 'done'),
    high: filtered.filter((t) => t.priority === 'high' && t.status !== 'done'),
    medium: filtered.filter((t) => t.priority === 'medium' && t.status !== 'done'),
    low: filtered.filter((t) => t.priority === 'low' && t.status !== 'done'),
    done: filtered.filter((t) => t.status === 'done'),
  }

  const totalDone = todos.filter((t) => t.status === 'done').length
  const totalTodo = todos.filter((t) => t.status !== 'done').length

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'todo', label: 'Active' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div className="page-content max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/95 mb-1">Tasks</h1>
          <p className="text-sm text-white/35">
            {totalTodo} active · {totalDone} completed
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-glow-blue"
        >
          <Plus size={16} />
          Add task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input-premium pl-9"
          />
        </div>

        {/* Status tabs */}
        <div className="flex bg-white/[0.04] rounded-lg p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                filter === tab.key
                  ? 'bg-white/[0.08] text-white/90'
                  : 'text-white/35 hover:text-white/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task groups */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <CheckSquare size={40} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 mb-2">No tasks found</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Create your first task
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {(Object.entries(grouped) as [string, Todo[]][]).map(([group, items]) => {
            if (items.length === 0) return null
            const labels: Record<string, string> = {
              urgent: '🔴 Urgent',
              high: '🟠 High',
              medium: '🟡 Medium',
              low: '🔵 Low',
              done: '✅ Completed',
            }
            return (
              <motion.div key={group} variants={fadeUpItem}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {labels[group]}
                  </span>
                  <span className="text-xs text-white/20">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onUpdate={() => qc.invalidateQueries({ queryKey: ['todos', user?.id] })}
                    />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && <AddTodoModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  )
}
