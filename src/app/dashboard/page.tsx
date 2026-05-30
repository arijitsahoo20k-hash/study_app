'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeUpItem } from '@/lib/utils/animations'
import { useAuthStore } from '@/lib/stores/authStore'
import { DashboardStats } from '@/components/modules/dashboard/DashboardStats'
import { TodayTasks } from '@/components/modules/dashboard/TodayTasks'
import { WeeklyChart } from '@/components/modules/dashboard/WeeklyChart'
import { UpcomingExams } from '@/components/modules/dashboard/UpcomingExams'
import { RecentActivity } from '@/components/modules/dashboard/RecentActivity'
import { QuickTimer } from '@/components/modules/dashboard/QuickTimer'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-content">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-white/30 text-sm mb-1">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 className="text-2xl font-bold text-white/95">
          {greeting}, {name} 👋
        </h1>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <DashboardStats />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={fadeUpItem} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <TodayTasks />
          </motion.div>
          <motion.div variants={fadeUpItem} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <WeeklyChart />
          </motion.div>
        </div>

        {/* Right column - 1/3 */}
        <div className="space-y-6">
          <motion.div variants={fadeUpItem} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
            <QuickTimer />
          </motion.div>
          <motion.div variants={fadeUpItem} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
            <UpcomingExams />
          </motion.div>
          <motion.div variants={fadeUpItem} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <RecentActivity />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
