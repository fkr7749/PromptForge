'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Globe, Star, Users, UserCheck, ArrowLeft, Play,
  Layers, Activity, BookOpen, TrendingUp, Zap, GitFork,
  MessageSquare, Eye, Crown, Calendar,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Avatar color palette ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#FF6B2B', '#00C27C', '#7C3AED', '#FFB800',
  '#E84040', '#0EA5E9', '#EC4899', '#14B8A6',
]

function getAvatarColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? '#FF6B2B'
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ProfileUser {
  id: string
  username: string
  displayName: string
  bio: string | null
  website: string | null
  avatarUrl: string | null
  isPremium: boolean
  createdAt: string
}

interface ProfileStats {
  promptsCount: number
  totalUpvotes: number
  followers: number
  following: number
}

interface ProfilePrompt {
  id: string
  title: string
  description: string | null
  category: string
  isPublic?: boolean
  upvoteCount: number
  viewCount: number
  forkCount: number
  createdAt: string
  tags?: Array<{ tag: { name: string; slug: string } }>
  _count: { executions: number; comments: number }
}

interface ProfileData {
  user: ProfileUser
  stats: ProfileStats
  prompts: ProfilePrompt[]
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-forge-border ${className ?? ''}`}
      style={{
        backgroundImage: 'linear-gradient(90deg,#D4D4D0 25%,#E8E8E4 50%,#D4D4D0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />
      <div className="container-forge pt-28 pb-16">
        <div className="rounded-2xl border-2 border-forge-border bg-white p-8 mb-8">
          <div className="flex items-start gap-6">
            <SkeletonBlock className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-7 w-48" />
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-4 w-full max-w-md" />
            </div>
          </div>
          <div className="mt-6 flex gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} className="h-16 w-28" />
            ))}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} className="h-52" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Prompt card (profile variant) ────────────────────────────────────────────
function ProfilePromptCard({ prompt, index }: { prompt: ProfilePrompt; index: number }) {
  const categoryColors: Record<string, string> = {
    CODING:       'bg-blue-100 text-blue-700',
    WRITING:      'bg-purple-100 text-purple-700',
    ANALYSIS:     'bg-green-100 text-green-700',
    EDUCATION:    'bg-yellow-100 text-yellow-700',
    BUSINESS:     'bg-indigo-100 text-indigo-700',
    MULTILINGUAL: 'bg-pink-100 text-pink-700',
    SAFETY:       'bg-red-100 text-red-700',
  }
  const catClass = categoryColors[prompt.category?.toUpperCase()] ?? 'bg-gray-100 text-gray-700'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col rounded-2xl border-2 border-forge-border bg-white transition-all duration-200 hover:border-forge-ink hover:shadow-[4px_4px_0_#0A0A0A]"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-black text-forge-ink leading-tight group-hover:text-forge-orange transition-colors line-clamp-2">
            {prompt.title}
          </h3>
          <Link
            href={`/playground?promptId=${prompt.id}`}
            className="shrink-0 flex items-center gap-1 rounded-lg border-2 border-forge-border px-2.5 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-forge-orange hover:bg-orange-50 hover:text-forge-orange"
          >
            <Play className="h-3 w-3" />
            Try
          </Link>
        </div>

        {prompt.description && (
          <p className="text-sm text-forge-muted leading-relaxed line-clamp-2">
            {prompt.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${catClass}`}>
            {prompt.category}
          </span>
          {prompt.tags?.slice(0, 2).map(({ tag }) => (
            <span
              key={tag.slug}
              className="rounded-full border border-forge-border bg-forge-silver px-2 py-0.5 text-[11px] font-bold text-forge-muted"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t-2 border-forge-border px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-forge-muted">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
            {prompt.upvoteCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {prompt.viewCount >= 1000
              ? `${(prompt.viewCount / 1000).toFixed(1)}k`
              : prompt.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {prompt._count.comments}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {prompt.forkCount}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({
  value,
  label,
  icon: Icon,
}: {
  value: number
  label: string
  icon: React.FC<{ className?: string }>
}) {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}K`
      : value.toString()

  return (
    <button className="flex flex-col items-center gap-1 rounded-2xl border-2 border-forge-border bg-forge-silver px-5 py-4 text-center transition-all hover:border-forge-ink hover:bg-white">
      <Icon className="h-4 w-4 text-forge-muted" />
      <span className="font-display text-xl font-black text-forge-ink">{formatted}</span>
      <span className="text-xs font-bold text-forge-muted uppercase tracking-wide">{label}</span>
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
type TabId = 'prompts' | 'collections' | 'activity'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = typeof params?.username === 'string' ? params.username : ''

  const { user: currentUser, accessToken } = useAuthStore()

  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('prompts')
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', website: '' })
  const [editSaving, setEditSaving] = useState(false)

  // Check follow status when profile data loads
  useEffect(() => {
    if (!accessToken || !data?.user?.id) return
    fetch(`/api/follow/${data.user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(res => setFollowing(res.following ?? false))
      .catch(() => {})
  }, [data?.user?.id, accessToken])

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError(null)

    fetch(`/api/users/${username}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error('User not found')
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json() as Promise<ProfileData>
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [username])

  if (loading) return <ProfileSkeleton />

  // Error / not found state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-forge-silver">
        <Navigation />
        <div className="container-forge flex min-h-[80vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-forge-border bg-white mx-auto">
              <Users className="h-10 w-10 text-forge-muted" />
            </div>
            <h1 className="mb-3 font-display text-3xl font-black text-forge-ink">
              User Not Found
            </h1>
            <p className="mb-8 text-forge-muted">
              {error === 'User not found'
                ? `@${username} doesn't exist or may have been removed.`
                : 'Something went wrong loading this profile.'}
            </p>
            <button
              onClick={() => router.back()}
              className="btn-orange inline-flex items-center gap-2 px-6 py-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const { user: profile, stats, prompts } = data
  const isOwnProfile = currentUser?.id === profile.id
  const avatarColor = getAvatarColor(profile.username)
  const initials = getInitials(profile.displayName || profile.username)

  // Activity tab: top 5 by execution count
  const topByExecutions = [...prompts]
    .sort((a, b) => b._count.executions - a._count.executions)
    .slice(0, 5)

  const tabs: Array<{ id: TabId; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'prompts',     label: 'Prompts',     icon: BookOpen  },
    { id: 'collections', label: 'Collections', icon: Layers    },
    { id: 'activity',   label: 'Activity',    icon: Activity  },
  ]

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="container-forge pt-28 pb-16">
        {/* ── Profile header card ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 rounded-2xl border-2 border-forge-border bg-white p-6 md:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-[3px_3px_0_#0A0A0A]"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-black text-forge-ink leading-none">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isPremium && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <Crown className="h-3 w-3" />
                    Creator
                  </span>
                )}
              </div>

              <p className="text-sm font-bold text-forge-muted mb-2">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="text-sm text-forge-muted leading-relaxed mb-3 max-w-lg">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-forge-muted">
                {profile.website && (
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-forge-orange transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <button
                  onClick={() => {
                    setEditForm({
                      displayName: profile.displayName || '',
                      bio: profile.bio || '',
                      website: profile.website || '',
                    })
                    setEditing(true)
                  }}
                  className="flex items-center gap-2 rounded-xl border-2 border-forge-border bg-white px-4 py-2 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      if (!accessToken) {
                        router.push('/login')
                        return
                      }
                      try {
                        const res = await fetch(`/api/follow/${profile.id}`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${accessToken}` },
                        })
                        const result = await res.json()
                        setFollowing(result.following)
                        setFollowerCount(result.followerCount)
                      } catch {}
                    }}
                    className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                      following
                        ? 'border-forge-ink bg-forge-ink text-white hover:border-red-500 hover:bg-red-50 hover:text-red-600'
                        : 'btn-orange border-forge-orange text-white'
                    }`}
                  >
                    {following ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-xl border-2 border-forge-border px-4 py-2 text-sm font-bold text-forge-muted opacity-50 cursor-not-allowed"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          {editing && (
            <div className="mt-6 rounded-xl border-2 border-forge-orange bg-orange-50 p-5">
              <h3 className="font-display text-sm font-black text-forge-ink mb-4">Edit Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-forge-muted mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    maxLength={100}
                    className="w-full rounded-lg border-2 border-forge-border bg-white px-3 py-2 text-sm text-forge-ink focus:border-forge-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-forge-muted mb-1 block">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border-2 border-forge-border bg-white px-3 py-2 text-sm text-forge-ink focus:border-forge-orange focus:outline-none resize-none"
                  />
                  <span className="text-[10px] text-forge-muted">{editForm.bio.length}/500</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-forge-muted mb-1 block">Website</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border-2 border-forge-border bg-white px-3 py-2 text-sm text-forge-ink focus:border-forge-orange focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={editSaving}
                    onClick={async () => {
                      setEditSaving(true)
                      try {
                        const res = await fetch('/api/users/me', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                          },
                          body: JSON.stringify(editForm),
                        })
                        if (res.ok) {
                          // Refresh profile data
                          const refreshRes = await fetch(`/api/users/${username}`)
                          if (refreshRes.ok) {
                            const json = await refreshRes.json() as ProfileData
                            setData(json)
                          }
                          setEditing(false)
                        }
                      } catch {
                        // silently fail
                      } finally {
                        setEditSaving(false)
                      }
                    }}
                    className="btn-orange px-5 py-2 text-xs disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border-2 border-forge-border bg-white px-5 py-2 text-xs font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap gap-3">
            <StatTile value={stats.promptsCount}  label="Prompts"   icon={BookOpen}   />
            <StatTile value={stats.totalUpvotes}   label="Stars"     icon={Star}       />
            <StatTile value={followerCount ?? stats.followers} label="Followers" icon={Users}      />
            <StatTile value={stats.following}      label="Following" icon={TrendingUp} />
          </div>
        </motion.div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex items-center gap-1 border-b-2 border-forge-border"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
                activeTab === id
                  ? 'text-forge-orange'
                  : 'text-forge-muted hover:text-forge-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {activeTab === id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-forge-orange"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Tab panels ────────────────────────────────────────────────── */}
        {activeTab === 'prompts' && (
          <div>
            {prompts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-20 text-center"
              >
                <BookOpen className="h-12 w-12 text-forge-border" />
                <h3 className="font-display text-xl font-black text-forge-ink">
                  No public prompts yet
                </h3>
                <p className="text-sm text-forge-muted">
                  {isOwnProfile
                    ? 'Create your first prompt to share it with the community.'
                    : `${profile.displayName || profile.username} hasn't published any prompts yet.`}
                </p>
                {isOwnProfile && (
                  <Link href="/dashboard" className="btn-orange mt-2 px-6 py-2.5 text-sm">
                    <Zap className="h-4 w-4" />
                    Create Prompt
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {prompts.map((prompt, i) => (
                  <ProfilePromptCard key={prompt.id} prompt={prompt} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-forge-border bg-white">
              <Layers className="h-8 w-8 text-forge-muted" />
            </div>
            <h3 className="font-display text-xl font-black text-forge-ink">
              Collections Coming Soon
            </h3>
            <p className="max-w-sm text-sm text-forge-muted">
              Curate and share themed collections of your favourite prompts.
              This feature is coming in a future update.
            </p>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {topByExecutions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <Activity className="h-12 w-12 text-forge-border" />
                <h3 className="font-display text-xl font-black text-forge-ink">
                  No activity yet
                </h3>
                <p className="text-sm text-forge-muted">Prompt executions will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-black uppercase tracking-wider text-forge-muted mb-1">
                  Most executed prompts
                </p>
                {topByExecutions.map((prompt, i) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-4 rounded-2xl border-2 border-forge-border bg-white px-5 py-4 transition-all hover:border-forge-ink"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forge-silver text-sm font-black text-forge-muted">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-forge-ink truncate">{prompt.title}</p>
                      <p className="text-xs text-forge-muted capitalize">{prompt.category.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-forge-muted shrink-0">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-forge-orange" />
                        <span className="font-bold text-forge-ink">
                          {prompt._count.executions.toLocaleString()}
                        </span>
                        {' '}runs
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                        {prompt.upvoteCount.toLocaleString()}
                      </span>
                    </div>
                    <Link
                      href={`/playground?promptId=${prompt.id}`}
                      className="shrink-0 flex items-center gap-1 rounded-lg border-2 border-forge-border px-2.5 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-forge-orange hover:bg-orange-50 hover:text-forge-orange"
                    >
                      <Play className="h-3 w-3" />
                      Try
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
