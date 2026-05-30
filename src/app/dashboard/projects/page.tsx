'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, Plus, Trash2, Edit2, X, BarChart3, CheckSquare, FileText } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem, modalVariants, backdropVariants } from '@/lib/utils/animations'
import type { Project } from '@/types/database'

const projectColors = [
  '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#6366F1',
]

const projectIcons = ['📚', '🔬', '💻', '🎯', '📝', '🧮', '🎨', '🌐', '⚗️', '📊']

interface ProjectStats {
  todos: number
  notes: number
  study_minutes: number
}

function ProjectCard({ project, stats, onDelete, onEdit }: {
  project: Project
  stats: ProjectStats
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card-premium overflow-hidden group cursor-default"
    >
      {/* Top accent */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}60)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${project.color}15`, border: `1px solid ${project.color}25` }}
            >
              {project.icon || '📁'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all">
              <Edit2 size={13} />
            </button>
            <button onClick={onDelete}
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CheckSquare, label: 'Tasks', value: stats.todos, color: 'text-emerald-400' },
            { icon: FileText, label: 'Notes', value: stats.notes, color: 'text-amber-400' },
            { icon: BarChart3, label: 'Hours', value: Math.round(stats.study_minutes / 60), color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="p-2.5 rounded-lg bg-white/[0.03] text-center">
              <s.icon size={13} className={cn('mx-auto mb-1', s.color)} />
              <p className="text-sm font-bold text-white/70 tabular-nums">{s.value}</p>
              <p className="text-[10px] text-white/25">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active badge */}
        {project.is_active && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/70 font-medium">Active</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ProjectModal({ project, onClose }: { project?: Project | null; onClose: () => void }) {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || projectColors[0],
    icon: project?.icon || projectIcons[0],
    is_active: project?.is_active ?? true,
  })

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (project) {
      await (supabase as any).from('projects').update({ ...form } as any).eq('id', project.id)
    } else {
      await (supabase as any).from('projects').insert({ user_id: user!.id, ...form } as any)
    }
    qc.invalidateQueries({ queryKey: ['projects', user?.id] })
    onClose()
  }

  return (
    <>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md card-premium p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white/90">
              {project ? 'Edit Project' : 'New Project'}
            </h2>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Project name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. JEE Mains 2025" className="input-premium" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Description</label>
              <input value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="What is this project for?" className="input-premium" />
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {projectIcons.map((icon) => (
                  <button key={icon} type="button" onClick={() => set('icon', icon)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-lg transition-all',
                      form.icon === icon
                        ? 'bg-white/[0.1] border border-white/20'
                        : 'hover:bg-white/[0.04]'
                    )}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {projectColors.map((c) => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      form.color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
              <span className="text-sm text-white/60">Mark as active</span>
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={cn(
                  'w-10 h-5 rounded-full border transition-all duration-200 relative',
                  form.is_active ? 'bg-blue-600 border-blue-500' : 'bg-white/[0.07] border-white/10'
                )}>
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                  animate={{ left: form.is_active ? '20px' : '1px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-sm font-medium hover:bg-white/[0.07] transition-all">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                {project ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*')
        .eq('user_id', user!.id).order('created_at')
      return data as Project[]
    },
    enabled: !!user?.id,
  })

  const { data: statsMap = {} } = useQuery({
    queryKey: ['project-stats', user?.id],
    queryFn: async () => {
      if (!projects.length) return {}
      const ids = projects.map((p) => p.id)

      const [todosRes, notesRes, sessionsRes] = await Promise.all([
        supabase.from('todos').select('project_id').in('project_id', ids),
        supabase.from('notes').select('project_id').in('project_id', ids),
        supabase.from('study_sessions').select('project_id, duration_minutes').in('project_id', ids),
      ])

      const stats: Record<string, ProjectStats> = {}
      for (const id of ids) {
        stats[id] = { todos: 0, notes: 0, study_minutes: 0 }
      }
      for (const t of (todosRes.data || []) as { project_id: string | null }[]) {
        if (t.project_id) stats[t.project_id].todos++
      }
      for (const n of (notesRes.data || []) as { project_id: string | null }[]) {
        if (n.project_id) stats[n.project_id].notes++
      }
      for (const s of (sessionsRes.data || []) as { project_id: string | null; duration_minutes: number }[]) {
        if (s.project_id) stats[s.project_id].study_minutes += s.duration_minutes
      }
      return stats
    },
    enabled: !!user?.id && projects.length > 0,
  })

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['projects', user?.id] })
  }

  return (
    <div className="page-content max-w-5xl mx-auto">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUpItem} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/95 mb-1">Projects</h1>
            <p className="text-sm text-white/35">{projects.length} workspaces</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-blue">
            <Plus size={16} /> New project
          </button>
        </motion.div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div variants={fadeUpItem} className="text-center py-20">
            <FolderOpen size={48} className="text-white/[0.06] mx-auto mb-4" />
            <p className="text-white/25 text-sm mb-2">No projects yet</p>
            <p className="text-white/15 text-xs mb-4">Organize your study by subject or goal</p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold mx-auto transition-all">
              <Plus size={15} /> Create first project
            </button>
          </motion.div>
        ) : (
          <motion.div variants={fadeUpItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={statsMap[project.id] || { todos: 0, notes: 0, study_minutes: 0 }}
                  onDelete={() => deleteProject(project.id)}
                  onEdit={() => setEditProject(project)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {(showModal || editProject) && (
          <ProjectModal
            project={editProject}
            onClose={() => { setShowModal(false); setEditProject(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
