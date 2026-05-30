'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { AmbientBackground } from '@/components/animations/AmbientBackground'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AmbientBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-white/30 text-sm">Loading</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AmbientBackground />
      <div className="noise-overlay" />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-glow-blue">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 8h6v6H8V8zM18 8h6v6h-6V8zM8 18h6v6H8v-6z" fill="white" opacity="0.9"/>
              <path d="M18 18h6v6h-6v-6z" fill="white" opacity="0.4"/>
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="badge-blue mb-6 mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Study Operating System
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white/95 mb-6 leading-tight tracking-tight">
            Study smarter.<br />
            <span className="text-gradient">Achieve more.</span>
          </h1>

          <p className="text-lg text-white/40 max-w-xl mx-auto mb-12 leading-relaxed">
            The complete study system for ambitious learners. Track hours, manage tasks, 
            log mistakes, and collaborate — all in one beautiful workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-glow-blue hover:shadow-glow-blue hover:scale-[1.02]"
            >
              Get started free
            </Link>
            <Link
              href="/auth"
              className="px-8 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-white/70 hover:text-white font-medium text-sm transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full"
        >
          {[
            { icon: '✓', label: 'Smart Tasks' },
            { icon: '⏱', label: 'Focus Timer' },
            { icon: '📊', label: 'Analytics' },
            { icon: '👥', label: 'Friends' },
          ].map((f) => (
            <div key={f.label} className="card-premium p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm text-white/50 font-medium">{f.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
