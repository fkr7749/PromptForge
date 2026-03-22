'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import {
  Menu, X, ArrowUpRight, Bell, ChevronDown,
  LayoutDashboard, BookOpen, User, LogOut, Shield,
  Heart, MessageCircle, GitFork, UserPlus, Zap, Trophy,
  ShoppingBag, Code, Settings, Bookmark,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/auth'

// ── Avatar palette ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#FF6B2B', '#00C27C', '#7C3AED', '#FFB800',
  '#E84040', '#0EA5E9', '#EC4899', '#14B8A6',
]

function getAvatarColor(username: string): string {
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length] ?? '#FF6B2B'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Nav links ────────────────────────────────────────────────────────────
const navLinks = [
  { label: 'Browse',        href: '/browse',        isNew: false },
  { label: 'Playground',    href: '/playground',    isNew: false },
  { label: 'RAG',           href: '/rag',           isNew: false },
  { label: 'Datasets',      href: '/datasets',      isNew: false },
  { label: 'Battle',        href: '/battle',        icon: Zap,    isNew: false },
  { label: 'Leaderboard',   href: '/leaderboard',   icon: Trophy, isNew: false },
  { label: 'Observability', href: '/observability', isNew: false },
  { label: 'Pricing',       href: '/pricing',       isNew: false },
  { label: 'Dashboard',     href: '/dashboard',     isNew: false },
]

// ── User dropdown ────────────────────────────────────────────────────────
function UserDropdown() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (!user) return null

  const avatarColor = getAvatarColor(user.username)
  const initials    = getInitials(user.displayName || user.username)

  function handleSignOut() {
    clearAuth()
    setOpen(false)
    router.push('/')
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell */}
      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-forge-border text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink mr-1">
        <Bell className="h-4 w-4" />
        {/* Notification badge */}
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-forge-orange text-[9px] font-black text-white leading-none">
          3
        </span>
      </button>

      {/* Avatar trigger — rendered as a sibling so they sit in a flex row */}
      <div className="absolute inset-0 hidden" />

      {/* We need bell + avatar in a flex row; reconstruct layout via the parent */}
      {/* (this component is wrapped in a flex div in Navigation) */}
    </div>
  )
}

// ── Main Navigation ───────────────────────────────────────────────────────
export default function Navigation() {
  const pathname = usePathname()
  const router   = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobile,   setMobile]   = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Dropdown state lives here so bell + avatar share a container
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { user, accessToken, clearAuth } = useAuthStore()

  // Notification state
  const [notifCount, setNotifCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  // Poll notification count
  useEffect(() => {
    if (!user || !accessToken) return
    const fetchCount = () => {
      fetch('/api/notifications/count', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.json())
        .then(data => setNotifCount(data.count ?? 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [user, accessToken])

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!showNotifications) return
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showNotifications])

  const fetchNotifications = () => {
    fetch('/api/notifications?limit=10', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => setNotifications(data.notifications ?? []))
      .catch(() => {})
  }

  const handleBellClick = () => {
    router.push('/notifications')
  }

  const markAllRead = () => {
    fetch('/api/notifications/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ all: true }),
    }).then(() => {
      setNotifCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }).catch(() => {})
  }

  const notifTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    return `${day}d ago`
  }

  const notifIcon = (type: string) => {
    switch (type) {
      case 'UPVOTE':  return Heart
      case 'COMMENT': return MessageCircle
      case 'FORK':    return GitFork
      case 'FOLLOW':  return UserPlus
      default:        return Bell
    }
  }

  const isHome = pathname === '/'
  const isDark = isHome && !scrolled

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Entrance animation
  useEffect(() => {
    if (!navRef.current) return
    gsap.fromTo(navRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.3 }
    )
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  function handleSignOut() {
    clearAuth()
    setDropdownOpen(false)
    setMobile(false)
    router.push('/')
  }

  const avatarColor = user ? getAvatarColor(user.username) : '#FF6B2B'
  const initials    = user ? getInitials(user.displayName || user.username) : ''

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'fixed left-0 right-0 top-0 z-50 opacity-0 transition-all duration-500',
        )}
      >
        <div
          className={cn(
            'mx-auto flex max-w-[1380px] items-center justify-between px-6 py-3 md:px-10 transition-all duration-500',
            scrolled
              ? 'border-b border-forge-border bg-forge-silver/96 backdrop-blur-md'
              : 'bg-transparent'
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className={cn(
              'transition-all duration-300',
              isDark ? 'text-forge-orange' : 'text-forge-black group-hover:text-forge-orange'
            )}>
              <Logo size={32} variant="filled" />
            </div>
            <span className={cn(
              'font-display text-lg font-black tracking-tight transition-colors duration-300',
              isDark ? 'text-white' : 'text-forge-ink'
            )}>
              Prompt<span className="text-forge-orange">Forge</span>
            </span>
          </Link>

          {/* Center links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(link => {
              const Icon = (link as any).icon as React.ComponentType<{ className?: string }> | undefined
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                    isDark
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : isActive
                      ? 'bg-forge-black text-white'
                      : 'text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink'
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  {link.label}
                  {(link as any).isNew && (
                    <span className="ml-0.5 rounded-full bg-forge-orange px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white leading-none">
                      NEW
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right section — auth-aware */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              /* ── Logged-in state ── */
              <>
                {/* Notification bell + dropdown */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={handleBellClick}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                      isDark
                        ? 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                        : 'border-forge-border text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                    )}
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {notifCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-forge-orange text-[9px] font-black text-white leading-none">
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full right-0 mt-2 w-80 rounded-2xl border-2 border-forge-border bg-white shadow-[3px_3px_0_#0A0A0A] z-50 overflow-hidden"
                        style={{ transformOrigin: 'top right' }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-forge-border">
                          <span className="text-sm font-black text-forge-ink">Notifications</span>
                          {notifCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs font-bold text-forge-orange hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notification list */}
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                              <Bell className="h-8 w-8 text-forge-border" />
                              <p className="text-sm text-forge-muted">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const Icon = notifIcon(n.type)
                              return (
                                <div
                                  key={n.id}
                                  className={cn(
                                    'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-forge-silver/50',
                                    !n.read && 'border-l-2 border-l-forge-orange bg-orange-50/30'
                                  )}
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forge-silver">
                                    <Icon className="h-4 w-4 text-forge-muted" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-forge-ink leading-tight truncate">
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-forge-muted leading-snug mt-0.5 line-clamp-2">
                                      {n.message}
                                    </p>
                                    <p className="text-[10px] text-forge-muted/60 mt-1">
                                      {notifTimeAgo(n.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User avatar + dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all',
                      isDark
                        ? 'border-white/20 hover:border-white/40'
                        : 'border-forge-border hover:border-forge-ink'
                    )}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      isDark ? 'text-white' : 'text-forge-ink'
                    )}>
                      {user.displayName?.split(' ')[0] || user.username}
                    </span>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      isDark ? 'text-white/60' : 'text-forge-muted',
                      dropdownOpen && 'rotate-180'
                    )} />
                  </button>

                  {/* Dropdown panel */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full right-0 mt-2 w-56 rounded-2xl border-2 border-forge-border bg-white shadow-[3px_3px_0_#0A0A0A] p-2 z-50"
                        style={{ transformOrigin: 'top right' }}
                      >
                        {/* User info header */}
                        <div className="flex items-center gap-3 px-3 py-3 mb-1">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-forge-ink truncate">
                              {user.displayName || user.username}
                            </p>
                            <p className="text-xs text-forge-muted truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <div className="my-1 h-px bg-forge-border" />

                        {/* Menu items */}
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'                },
                          { icon: Settings,         label: 'Settings',    href: '/settings'                 },
                          { icon: Bookmark,         label: 'Saved Prompts', href: '/saved'                  },
                          { icon: BookOpen,         label: 'My Prompts',  href: '/browse?author=me'         },
                          { icon: User,             label: 'Profile',     href: `/profile/${user.username}` },
                          { icon: ShoppingBag,      label: 'Marketplace', href: '/marketplace'              },
                          { icon: Code,             label: 'Developer',   href: '/developer'                },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            href={href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-forge-muted transition-colors hover:bg-forge-silver hover:text-forge-ink"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                          </Link>
                        ))}

                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-forge-muted transition-colors hover:bg-forge-silver hover:text-forge-ink"
                          >
                            <Shield className="h-4 w-4 shrink-0" />
                            Admin Panel
                          </Link>
                        )}

                        <div className="my-1 h-px bg-forge-border" />

                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* ── Logged-out state ── */
              <>
                <Link
                  href="/login"
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    isDark ? 'text-white/60 hover:text-white' : 'text-forge-muted hover:text-forge-ink'
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border-2 px-5 py-2.5 text-sm font-black transition-all',
                    isDark
                      ? 'border-white/20 bg-white/5 text-white hover:border-forge-orange hover:bg-forge-orange backdrop-blur-sm'
                      : 'btn-orange'
                  )}
                >
                  Get Started
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-all md:hidden',
              isDark
                ? 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                : 'border-forge-border text-forge-muted hover:border-forge-ink hover:text-forge-ink'
            )}
            onClick={() => setMobile(v => !v)}
            aria-label="Toggle menu"
          >
            {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-14 z-40 border-b border-forge-border bg-forge-silver/98 backdrop-blur-sm md:hidden"
          >
            <div className="flex flex-col gap-0.5 p-4">
              {navLinks.map(link => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobile(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-forge-black text-white'
                        : 'text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink'
                    )}
                  >
                    {link.label}
                    {(link as any).isNew && (
                      <span className="rounded-full bg-forge-orange px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white leading-none">
                        NEW
                      </span>
                    )}
                  </Link>
                )
              })}

              <div className="mt-3 flex flex-col gap-2 border-t border-forge-border pt-3">
                {user ? (
                  /* Mobile — logged in */
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 rounded-xl bg-white border-2 border-forge-border px-4 py-3 mb-1">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-forge-ink truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-forge-muted truncate">@{user.username}</p>
                      </div>
                    </div>

                    <Link href="/dashboard" onClick={() => setMobile(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link href="/settings" onClick={() => setMobile(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link href="/saved" onClick={() => setMobile(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink"
                    >
                      <Bookmark className="h-4 w-4" />
                      Saved Prompts
                    </Link>
                    <Link href={`/profile/${user.username}`} onClick={() => setMobile(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-forge-muted hover:bg-forge-black/6 hover:text-forge-ink"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  /* Mobile — logged out */
                  <>
                    <Link href="/login" onClick={() => setMobile(false)} className="btn-ghost text-sm justify-center py-3">
                      Sign in
                    </Link>
                    <Link href="/register" onClick={() => setMobile(false)} className="btn-orange text-sm justify-center py-3">
                      Get Started Free <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
