'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, GitFork, UserPlus, DollarSign,
  Trophy, Bell, ArrowRight,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string
  type: 'UPVOTE' | 'COMMENT' | 'FORK' | 'FOLLOW' | 'SALE' | 'ACHIEVEMENT' | 'MENTION'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.floor(day / 7)
  return `${wk}w ago`
}

function getGroup(dateStr: string): 'TODAY' | 'THIS WEEK' | 'EARLIER' {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 1) return 'TODAY'
  if (diffDays < 7) return 'THIS WEEK'
  return 'EARLIER'
}

const TYPE_CONFIG: Record<string, {
  Icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  label: string
}> = {
  UPVOTE: {
    Icon: Heart,
    color: 'text-forge-orange',
    bg: 'bg-orange-100',
    label: 'upvoted your prompt',
  },
  COMMENT: {
    Icon: MessageCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'commented on',
  },
  FORK: {
    Icon: GitFork,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'forked your prompt',
  },
  FOLLOW: {
    Icon: UserPlus,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'started following you',
  },
  SALE: {
    Icon: DollarSign,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    label: 'purchased',
  },
  ACHIEVEMENT: {
    Icon: Trophy,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    label: 'earned badge',
  },
  MENTION: {
    Icon: MessageCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'mentioned you in',
  },
}

const AVATAR_COLORS = [
  '#FF6B2B', '#00C27C', '#7C3AED', '#FFB800',
  '#E84040', '#0EA5E9', '#EC4899', '#14B8A6',
]

function getAvatarColor(str: string): string {
  return AVATAR_COLORS[(str.charCodeAt(0) || 0) % AVATAR_COLORS.length] ?? '#FF6B2B'
}

function extractActorInitials(notification: Notification): string {
  // Try to parse actor from message/data
  const data = notification.data as { actorUsername?: string; actorDisplayName?: string } | undefined
  if (data?.actorDisplayName) {
    return data.actorDisplayName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (data?.actorUsername) {
    return data.actorUsername.slice(0, 2).toUpperCase()
  }
  // Parse from title
  const firstWord = notification.title.split(' ')[0] ?? '?'
  return firstWord.slice(0, 2).toUpperCase()
}

function extractActorName(notification: Notification): string {
  const data = notification.data as { actorDisplayName?: string; actorUsername?: string } | undefined
  return data?.actorDisplayName || data?.actorUsername || notification.title.split(' ')[0] || 'Someone'
}

function extractPromptTitle(notification: Notification): string | null {
  const data = notification.data as { promptTitle?: string } | undefined
  return data?.promptTitle ?? null
}

function extractBadgeName(notification: Notification): string | null {
  const data = notification.data as { badgeName?: string } | undefined
  return data?.badgeName ?? null
}

function getNotificationLink(notification: Notification): string {
  const data = notification.data as { promptId?: string; actorUsername?: string } | undefined
  switch (notification.type) {
    case 'UPVOTE':
    case 'COMMENT':
    case 'FORK':
    case 'SALE':
      if (data?.promptId) return `/prompts/${data.promptId}`
      return '/dashboard'
    case 'FOLLOW':
      if (data?.actorUsername) return `/profile/${data.actorUsername}`
      return '/dashboard'
    case 'ACHIEVEMENT':
      return '/profile'
    default:
      return '/dashboard'
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 rounded-xl border-2 border-forge-border bg-white p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-forge-border shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-forge-border" />
        <div className="h-3 w-1/2 rounded bg-forge-border" />
      </div>
      <div className="h-3 w-12 rounded bg-forge-border shrink-0" />
    </div>
  )
}

// ── Notification Card ─────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string, link: string) => void
}) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG['MENTION']!
  const { Icon, color, bg } = config
  const actorName = extractActorName(notification)
  const promptTitle = extractPromptTitle(notification)
  const badgeName = extractBadgeName(notification)
  const initials = extractActorInitials(notification)
  const avatarBg = getAvatarColor(actorName)
  const link = getNotificationLink(notification)

  function renderContent() {
    switch (notification.type) {
      case 'UPVOTE':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            <span className="font-bold">{actorName}</span>{' '}
            <span className={cn('font-bold', color)}>upvoted</span> your prompt{' '}
            {promptTitle && <span className="font-bold text-forge-ink">{promptTitle}</span>}
          </span>
        )
      case 'COMMENT':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            <span className="font-bold">{actorName}</span>{' '}
            <span className={cn('font-bold', color)}>commented</span> on{' '}
            {promptTitle && <span className="font-bold text-forge-ink">{promptTitle}</span>}
          </span>
        )
      case 'FORK':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            <span className="font-bold">{actorName}</span>{' '}
            <span className={cn('font-bold', color)}>forked</span> your prompt{' '}
            {promptTitle && <span className="font-bold text-forge-ink">{promptTitle}</span>}
          </span>
        )
      case 'FOLLOW':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            <span className="font-bold">{actorName}</span>{' '}
            <span className={cn('font-bold', color)}>started following</span> you
          </span>
        )
      case 'SALE':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            <span className="font-bold">{actorName}</span>{' '}
            <span className={cn('font-bold', color)}>purchased</span>{' '}
            {promptTitle && <span className="font-bold text-forge-ink">{promptTitle}</span>}
          </span>
        )
      case 'ACHIEVEMENT':
        return (
          <span className="text-sm text-forge-ink leading-snug">
            You{' '}
            <span className={cn('font-bold', color)}>earned</span> the{' '}
            <span className="font-bold text-forge-ink">{badgeName ?? 'achievement'}</span> badge
          </span>
        )
      default:
        return (
          <span className="text-sm text-forge-ink leading-snug">
            {notification.message}
          </span>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onRead(notification.id, link)}
      className={cn(
        'flex cursor-pointer items-start gap-4 rounded-xl border-2 border-forge-border bg-white p-4',
        'transition-colors hover:bg-forge-silver',
        !notification.read && 'border-l-[3px] border-l-forge-orange'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ backgroundColor: avatarBg }}
        >
          {initials}
        </div>
        <div className={cn(
          'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white',
          bg
        )}>
          <Icon className={cn('h-2.5 w-2.5', color)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
        <p className="text-xs text-forge-muted mt-1.5">
          {notification.title !== actorName ? notification.title : ''}
        </p>
      </div>

      {/* Time */}
      <div className="shrink-0 text-xs text-forge-muted whitespace-nowrap">
        {timeAgo(notification.createdAt)}
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user, accessToken } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchNotifications()
  }, [user, router, fetchNotifications])

  async function handleMarkAllRead() {
    if (!accessToken || markingAll) return
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleNotificationRead(id: string, link: string) {
    if (!accessToken) return
    // Optimistically mark as read
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      // Ignore errors silently
    }
    router.push(link)
  }

  const hasUnread = notifications.some(n => !n.read)

  // Group notifications
  const groups: { label: string; items: Notification[] }[] = []
  const groupMap: Record<string, Notification[]> = { TODAY: [], 'THIS WEEK': [], EARLIER: [] }
  for (const n of notifications) {
    groupMap[getGroup(n.createdAt)]?.push(n)
  }
  for (const label of ['TODAY', 'THIS WEEK', 'EARLIER'] as const) {
    if (groupMap[label]!.length > 0) {
      groups.push({ label, items: groupMap[label]! })
    }
  }

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="container-forge pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl text-forge-ink tracking-tight">
              NOTIFICATIONS
            </h1>
            <p className="text-forge-muted mt-1 text-sm">
              {loading ? 'Loading...' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {hasUnread && !loading && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="btn-orange text-sm px-4 py-2.5 rounded-xl disabled:opacity-60"
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-forge-border bg-white mb-6">
              <Bell className="h-10 w-10 text-forge-border" />
            </div>
            <h2 className="font-display font-black text-2xl text-forge-ink mb-2">
              You're all caught up.
            </h2>
            <p className="text-forge-muted text-base mb-8 max-w-xs">
              Go publish something worth noticing.
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="btn-orange inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black"
            >
              Browse Prompts
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          /* Grouped notifications */
          <div className="space-y-8">
            <AnimatePresence>
              {groups.map(group => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-black text-forge-muted uppercase tracking-widest mb-3 px-1">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map(notification => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onRead={handleNotificationRead}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
