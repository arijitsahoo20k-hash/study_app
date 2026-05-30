'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, Clock, BarChart3,
  FileText, BookOpen, Users, FolderOpen, Settings,
  Menu, X, ChevronRight, LogOut, Zap
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { AmbientBackground } from '@/components/animations/AmbientBackground'
import { MouseGlow } from '@/components/animations/MouseGlow'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-400' },
  { href: '/dashboard/todos', icon: CheckSquare, label: 'Tasks', color: 'text-emerald-400' },
  { href: '/dashboard/timer', icon: Clock, label: 'Timer', color: 'text-purple-400' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', color: 'text-cyan-400' },
  { href: '/dashboard/notes', icon: FileText, label: 'Notes', color: 'text-amber-400' },
  { href: '/dashboard/mistakes', icon: BookOpen, label: 'Mistakes', color: 'text-red-400' },
  { href: '/dashboard/exams', icon: Zap, label: 'Exams', color: 'text-orange-400' },
  { href: '/dashboard/friends', icon: Users, label: 'Friends', color: 'text-pink-400' },
  { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects', color: 'text-indigo-400' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#050816] flex">
      <AmbientBackground />
      <MouseGlow />
      <div className="noise-overlay" />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 z-50 flex flex-col',
          'bg-[#050816]/95 backdrop-blur-xl border-r border-white/[0.05]',
          'transition-transform duration-300 ease-out-expo lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M8 8h6v6H8V8zM18 8h6v6h-6V8zM8 18h6v6H8v-6z" fill="white" opacity="0.9"/>
              <path d="M18 18h6v6h-6v-6z" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold text-white/90 tracking-tight">Study OS</span>
            <p className="text-xs text-white/25 mt-0.5">Study Operating System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white/30 hover:text-white/60 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn('sidebar-nav-item', isActive && 'active')}
              >
                <item.icon
                  size={17}
                  className={cn('flex-shrink-0 transition-colors', isActive ? item.color : 'text-white/30')}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className={cn('flex-shrink-0', item.color)} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/[0.05] space-y-0.5">
          <Link
            href="/dashboard/settings"
            className="sidebar-nav-item"
          >
            <Settings size={17} className="flex-shrink-0 text-white/30" />
            Settings
          </Link>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-semibold text-white/70 flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/70 truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}
              </p>
              <p className="text-[10px] text-white/25 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 relative">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 lg:hidden bg-[#050816]/80 backdrop-blur-xl border-b border-white/[0.05]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-white/80">
            {navItems.find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
          </span>
        </div>

        {/* Page content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 min-h-screen"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
