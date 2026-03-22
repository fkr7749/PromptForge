'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, FolderOpen, Trash2, X, Play, Heart, GitFork,
  ChevronRight, Globe, Lock, Loader2, ArrowRight,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
interface CollectionPromptPreview {
  id: string
  title: string
  category: string
  upvoteCount: number
}

interface CollectionItemFull {
  collectionId: string
  promptId: string
  addedAt: string
  prompt: {
    id: string
    title: string
    description: string
    category: string
    upvoteCount: number
    forkCount: number
    author: { id: string; username: string; displayName: string }
    tags: Array<{ tag: { name: string; slug: string } }>
  }
}

interface Collection {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
  _count: { items: number }
  items: Array<{ prompt: CollectionPromptPreview }>
}

interface CollectionDetail {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: { id: string; username: string; displayName: string }
  _count: { items: number }
  items: CollectionItemFull[]
}

const CATEGORY_COLORS: Record<string, string> = {
  CODING: 'bg-blue-100 text-blue-700',
  WRITING: 'bg-green-100 text-green-700',
  BUSINESS: 'bg-purple-100 text-purple-700',
  ANALYSIS: 'bg-yellow-100 text-yellow-700',
  EDUCATION: 'bg-pink-100 text-pink-700',
  CREATIVITY: 'bg-orange-100 text-forge-orange',
  RESEARCH: 'bg-cyan-100 text-cyan-700',
  ROLEPLAY: 'bg-rose-100 text-rose-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-forge-border" />
        <div className="h-5 w-5 animate-pulse rounded bg-forge-border" />
      </div>
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-forge-silver" />
      <div className="mt-2 flex gap-2">
        <div className="h-4 w-20 animate-pulse rounded-full bg-forge-silver" />
        <div className="h-4 w-16 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-forge-silver" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-forge-silver" />
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // New collection form
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Expanded collection
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<CollectionDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Removing item
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  // Auth redirect
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const fetchCollections = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/collections', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to fetch collections')
      const data = await res.json()
      setCollections(data.collections)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (user && accessToken) {
      fetchCollections()
    }
  }, [user, accessToken, fetchCollections])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !formName.trim()) return
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          isPublic: formIsPublic,
        }),
      })
      if (!res.ok) throw new Error('Failed to create collection')
      setFormName('')
      setFormDescription('')
      setFormIsPublic(false)
      setShowForm(false)
      await fetchCollections()
    } catch (err) {
      console.error(err)
    } finally {
      setFormSubmitting(false)
    }
  }

  const fetchCollectionDetail = async (id: string) => {
    if (!accessToken) return
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/collections/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to fetch collection detail')
      const data = await res.json()
      setExpandedDetail(data.collection)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleExpandCollection = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
    } else {
      setExpandedId(id)
      fetchCollectionDetail(id)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!accessToken) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to delete collection')
      setConfirmDeleteId(null)
      setExpandedId(null)
      setExpandedDetail(null)
      await fetchCollections()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveItem = async (collectionId: string, promptId: string) => {
    if (!accessToken) return
    setRemovingItemId(promptId)
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ promptId }),
      })
      if (!res.ok) throw new Error('Failed to remove item')
      // Refresh detail
      await fetchCollectionDetail(collectionId)
      // Refresh list counts
      await fetchCollections()
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingItemId(null)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* Page header */}
      <div className="border-b-2 border-forge-border bg-white pt-24 pb-8">
        <div className="container-forge">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-label mb-2">Your Library</div>
              <h1
                className="font-display font-black text-forge-ink"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                MY
                <br />
                <span className="text-gradient">COLLECTIONS</span>
              </h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-orange flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          </div>
        </div>
      </div>

      <div className="container-forge py-8">
        {/* New Collection Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleCreateCollection}
                className="mb-8 rounded-2xl border-2 border-forge-border bg-white p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-black text-forge-ink">
                    Create Collection
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg p-1.5 text-forge-muted transition-colors hover:text-forge-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-forge-ink">
                      Name <span className="text-forge-orange">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. My Favorite Coding Prompts"
                      maxLength={100}
                      required
                      className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-forge-ink">
                      Description
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="What is this collection about?"
                      rows={2}
                      className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormIsPublic(!formIsPublic)}
                      className={`relative h-6 w-11 rounded-full border-2 transition-colors ${
                        formIsPublic
                          ? 'border-forge-orange bg-forge-orange'
                          : 'border-forge-border bg-forge-silver'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          formIsPublic ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-forge-ink">
                      {formIsPublic ? (
                        <>
                          <Globe className="h-3.5 w-3.5" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Private
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={formSubmitting || !formName.trim()}
                      className="btn-orange flex items-center gap-2 disabled:opacity-50"
                    >
                      {formSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collection Grid / Loading / Empty */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : collections.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((col, i) => (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: i * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => handleExpandCollection(col.id)}
                    className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-white p-6 transition-all duration-200 hover:shadow-[4px_4px_0_#1A1A1A] ${
                      expandedId === col.id
                        ? 'border-forge-orange'
                        : 'border-forge-border hover:border-forge-ink'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 shrink-0 text-forge-orange" />
                        <h3 className="font-display text-base font-black leading-tight text-forge-ink transition-colors group-hover:text-forge-orange">
                          {col.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {col.isPublic ? (
                          <Globe className="h-3.5 w-3.5 text-forge-muted" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-forge-muted" />
                        )}
                        <ChevronRight
                          className={`h-4 w-4 text-forge-muted transition-transform ${
                            expandedId === col.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    {col.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-forge-muted">
                        {col.description}
                      </p>
                    )}

                    {/* Item count */}
                    <div className="mt-3 text-xs font-bold text-forge-muted">
                      {col._count.items} {col._count.items === 1 ? 'prompt' : 'prompts'}
                    </div>

                    {/* Preview items */}
                    {col.items.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {col.items.map(({ prompt }) => (
                          <div
                            key={prompt.id}
                            className="flex items-center gap-2 text-xs text-forge-muted"
                          >
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                CATEGORY_COLORS[prompt.category] ?? 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {prompt.category}
                            </span>
                            <span className="truncate font-medium">{prompt.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Expanded Detail Panel */}
              <AnimatePresence>
                {expandedId && (
                  <motion.div
                    key={`detail-${expandedId}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border-2 border-forge-orange bg-white p-6">
                      {loadingDetail || !expandedDetail ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-forge-orange" />
                        </div>
                      ) : (
                        <>
                          {/* Detail Header */}
                          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h2 className="font-display text-xl font-black text-forge-ink">
                                {expandedDetail.name}
                              </h2>
                              {expandedDetail.description && (
                                <p className="mt-1 text-sm text-forge-muted">
                                  {expandedDetail.description}
                                </p>
                              )}
                              <span className="mt-2 inline-block text-xs font-bold text-forge-muted">
                                {expandedDetail._count.items}{' '}
                                {expandedDetail._count.items === 1 ? 'prompt' : 'prompts'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(expandedId)
                              }}
                              className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:border-red-400 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Collection
                            </button>
                          </div>

                          {/* Delete Confirmation */}
                          <AnimatePresence>
                            {confirmDeleteId === expandedId && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="mb-6 flex items-center justify-between rounded-xl border-2 border-red-300 bg-red-50 p-4"
                              >
                                <p className="text-sm font-bold text-red-700">
                                  Are you sure? This will permanently delete this collection.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteId(null)
                                    }}
                                    className="rounded-lg border-2 border-forge-border bg-white px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteCollection(expandedId!)
                                    }}
                                    disabled={deleting}
                                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {deleting && (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Items list */}
                          {expandedDetail.items.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm text-forge-muted">
                                This collection is empty. Add prompts from the{' '}
                                <Link
                                  href="/browse"
                                  className="font-bold text-forge-orange hover:underline"
                                >
                                  Browse
                                </Link>{' '}
                                page.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {expandedDetail.items.map(({ prompt }, i) => (
                                <motion.div
                                  key={prompt.id}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: i * 0.03,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="flex items-center gap-4 rounded-xl border-2 border-forge-border p-4 transition-colors hover:border-forge-ink"
                                >
                                  {/* Category badge */}
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                                      CATEGORY_COLORS[prompt.category] ??
                                      'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {prompt.category}
                                  </span>

                                  {/* Info */}
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      href={`/prompt/${prompt.id}`}
                                      className="font-display text-sm font-black text-forge-ink transition-colors hover:text-forge-orange"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {prompt.title}
                                    </Link>
                                    <div className="mt-0.5 flex items-center gap-3 text-xs text-forge-muted">
                                      <span>@{prompt.author.username}</span>
                                      <span className="flex items-center gap-1">
                                        <Heart className="h-3 w-3" />
                                        {prompt.upvoteCount}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <GitFork className="h-3 w-3" />
                                        {prompt.forkCount}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                      href={`/playground?promptId=${prompt.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-2.5 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-forge-orange hover:bg-orange-50 hover:text-forge-orange"
                                    >
                                      <Play className="h-3 w-3" />
                                      Try
                                    </Link>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveItem(expandedId!, prompt.id)
                                      }}
                                      disabled={removingItemId === prompt.id}
                                      className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-2.5 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    >
                                      {removingItemId === prompt.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                      Remove
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-24 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-forge-border bg-white">
                <FolderOpen className="h-8 w-8 text-forge-border" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-forge-ink">
                  No collections yet
                </h3>
                <p className="mt-2 text-sm text-forge-muted">
                  Start saving prompts from the Browse page.
                </p>
              </div>
              <Link href="/browse" className="btn-orange flex items-center gap-2">
                Browse Prompts <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
