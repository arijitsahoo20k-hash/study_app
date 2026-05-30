'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Search, Pin, Archive, Trash2, Tag, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { timeAgo } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { staggerContainer, fadeUpItem, modalVariants, backdropVariants } from '@/lib/utils/animations'
import type { Note } from '@/types/database'

export default function NotesPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived'>('all')

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
      return data as Note[]
    },
    enabled: !!user?.id,
  })

  const filtered = notes.filter((n) => {
    if (filter === 'pinned' && !n.is_pinned) return false
    if (filter === 'archived' && !n.is_archived) return false
    if (filter === 'all' && n.is_archived) return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.content.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const openNote = (note: Note) => {
    setActiveNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const createNote = async () => {
    const { data } = await (supabase as any).from('notes').insert({
      user_id: user!.id,
      title: 'Untitled note',
      content: '',
      tags: [] as string[],
      is_pinned: false,
      is_archived: false,
    }).select().single()
    if (data) {
      qc.invalidateQueries({ queryKey: ['notes', user?.id] })
      openNote(data as Note)
    }
  }

  const saveNote = useCallback(async () => {
    if (!activeNote) return
    setSaving(true)
    await (supabase as any).from('notes').update({
      title: editTitle || 'Untitled note',
      content: editContent,
      updated_at: new Date().toISOString(),
    } as { title: string; content: string; updated_at: string }).eq('id', activeNote.id)
    qc.invalidateQueries({ queryKey: ['notes', user?.id] })
    setTimeout(() => setSaving(false), 600)
  }, [activeNote, editTitle, editContent, supabase, qc, user])

  const togglePin = async (note: Note) => {
    await (supabase as any).from('notes').update({ is_pinned: !note.is_pinned } as { is_pinned: boolean }).eq('id', note.id)
    qc.invalidateQueries({ queryKey: ['notes', user?.id] })
  }

  const archiveNote = async (note: Note) => {
    await (supabase as any).from('notes').update({ is_archived: !note.is_archived } as { is_archived: boolean }).eq('id', note.id)
    qc.invalidateQueries({ queryKey: ['notes', user?.id] })
    if (activeNote?.id === note.id) setActiveNote(null)
  }

  const deleteNote = async (note: Note) => {
    await supabase.from('notes').delete().eq('id', note.id)
    qc.invalidateQueries({ queryKey: ['notes', user?.id] })
    if (activeNote?.id === note.id) setActiveNote(null)
  }

  // Auto-save on blur
  const handleBlur = () => { if (activeNote) saveNote() }

  // Preview text
  const preview = (content: string) => {
    const plain = content.replace(/[#*`_\[\]]/g, '').trim()
    return plain.slice(0, 80) + (plain.length > 80 ? '…' : '')
  }

  return (
    <div className="page-content h-[calc(100vh-4rem)] lg:h-screen flex flex-col p-0 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={cn(
          'flex flex-col border-r border-white/[0.05] bg-[#050816]/60',
          activeNote ? 'hidden lg:flex w-72 flex-shrink-0' : 'flex w-full lg:w-72 lg:flex-shrink-0'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-bold text-white/90">Notes</h1>
              <button
                onClick={createNote}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="input-premium pl-8 text-xs py-2"
              />
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 mt-2">
              {(['all', 'pinned', 'archived'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex-1 py-1 text-[10px] font-semibold rounded-md capitalize transition-all',
                    filter === f ? 'bg-white/[0.08] text-white/80' : 'text-white/30 hover:text-white/50'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">No notes yet</p>
                <button
                  onClick={createNote}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map((note) => (
                  <motion.button
                    key={note.id}
                    onClick={() => openNote(note)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-all duration-200 group',
                      activeNote?.id === note.id
                        ? 'bg-white/[0.07] border border-white/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white/80 truncate flex-1">{note.title}</p>
                      {note.is_pinned && <Pin size={11} className="text-yellow-400 flex-shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">
                      {preview(note.content) || 'Empty note'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={10} className="text-white/20" />
                      <span className="text-[10px] text-white/20">{timeAgo(note.updated_at)}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          !activeNote && 'hidden lg:flex'
        )}>
          {activeNote ? (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.05]">
                <button
                  onClick={() => setActiveNote(null)}
                  className="lg:hidden text-xs text-white/40 hover:text-white/70 transition-colors mr-4"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-1 flex-1">
                  <span className={cn(
                    'text-xs transition-all duration-300',
                    saving ? 'text-blue-400' : 'text-white/20'
                  )}>
                    {saving ? 'Saving…' : 'Auto-saved'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(activeNote)}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      activeNote.is_pinned
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : 'text-white/20 hover:text-white/50 hover:bg-white/[0.04]'
                    )}
                    title="Pin note"
                  >
                    <Pin size={15} />
                  </button>
                  <button
                    onClick={() => archiveNote(activeNote)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                    title="Archive"
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    onClick={() => deleteNote(activeNote)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Editor content */}
              <div className="flex-1 overflow-y-auto scrollbar-none px-6 lg:px-12 py-8 max-w-3xl w-full mx-auto">
                {/* Title */}
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Note title"
                  className="w-full bg-transparent text-2xl font-bold text-white/90 placeholder:text-white/20 outline-none mb-6 border-none"
                />

                {/* Markdown hints bar */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.05]">
                  {['# H1', '## H2', '**bold**', '*italic*', '- list', '> quote', '`code`'].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => {
                        setEditContent((c) => c + (c ? '\n' : '') + hint + ' ')
                      }}
                      className="text-[10px] font-mono text-white/25 hover:text-white/50 hover:bg-white/[0.04] px-2 py-1 rounded transition-all"
                    >
                      {hint}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Start writing… Markdown is supported."
                  className="w-full bg-transparent text-[15px] text-white/75 leading-relaxed placeholder:text-white/20 outline-none resize-none min-h-[60vh] border-none font-mono"
                  style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                />

                {/* Rendered preview hint */}
                <div className="mt-8 pt-4 border-t border-white/[0.04]">
                  <p className="text-xs text-white/15">
                    {editContent.split(' ').filter(Boolean).length} words · {editContent.length} chars
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText size={48} className="text-white/[0.06] mx-auto mb-4" />
                <p className="text-white/20 text-sm mb-3">Select a note to start editing</p>
                <button
                  onClick={createNote}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold mx-auto transition-all"
                >
                  <Plus size={15} />
                  New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
