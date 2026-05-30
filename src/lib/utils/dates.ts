import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, subDays, addDays } from 'date-fns'

export const formatDate = (date: Date | string) => {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const formatHours = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export const getWeekDays = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))
}

export const getLast30Days = () => {
  return Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))
}

export const timeAgo = (date: Date | string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export const getCountdown = (targetDate: Date | string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} => {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = Math.max(0, target.getTime() - now.getTime())
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  }
}

export const getDayName = (date: Date): string => {
  return format(date, 'EEE')
}

export const formatShortDate = (date: Date | string): string => {
  return format(new Date(date), 'MMM d')
}

export const todayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}
