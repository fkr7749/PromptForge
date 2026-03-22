'use client'

import { useEffect, useState } from 'react'

interface Version {
  id: string
  version: number
  changelog?: string | null
}

interface Release {
  id: string
  promptId: string
  versionId: string
  environment: string
  notes?: string | null
  createdAt: string
  approvedBy?: string | null
  version?: Version
}

interface ReleaseTimelineProps {
  promptId: string
  versions: Version[]
}

const ENV_ORDER = ['draft', 'review', 'approved', 'production'] as const
type Env = typeof ENV_ORDER[number]

const ENV_BADGE: Record<Env, string> = {
  draft: 'bg-gray-700 text-gray-300',
  review: 'bg-amber-900/60 text-amber-300',
  approved: 'bg-blue-900/60 text-blue-300',
  production: 'bg-green-900/60 text-green-300',
}

function nextEnv(env: string): Env | null {
  const idx = ENV_ORDER.indexOf(env as Env)
  if (idx === -1 || idx === ENV_ORDER.length - 1) return null
  return ENV_ORDER[idx + 1] ?? null
}

function EnvBadge({ env }: { env: string }) {
  const cls = ENV_BADGE[env as Env] ?? 'bg-gray-700 text-gray-300'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${cls}`}>{env}</span>
  )
}

export default function ReleaseTimeline({ promptId, versions }: ReleaseTimelineProps) {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedVersion, setSelectedVersion] = useState(versions[0]?.id ?? '')
  const [selectedEnv, setSelectedEnv] = useState<Env>('draft')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchReleases()
  }, [promptId])

  async function fetchReleases() {
    try {
      const res = await fetch(`/api/prompts/${promptId}/releases`)
      if (!res.ok) throw new Error('Failed to load releases')
      const data = await res.json()
      setReleases(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRelease(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVersion) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/prompts/${promptId}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: selectedVersion, environment: selectedEnv, notes }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create release')
      }
      setNotes('')
      await fetchReleases()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePromote(release: Release) {
    const next = nextEnv(release.environment)
    if (!next) return
    try {
      const res = await fetch(`/api/prompts/${promptId}/releases/${release.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: next }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to promote release')
      }
      await fetchReleases()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Release Form */}
      <div className="card-hard p-6">
        <h3 className="text-base font-semibold mb-4">Promote Version</h3>
        <form onSubmit={handleCreateRelease} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Version</label>
              <select
                value={selectedVersion}
                onChange={e => setSelectedVersion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B2B]"
                required
              >
                {versions.length === 0 && (
                  <option value="" disabled>No versions available</option>
                )}
                {versions.map(v => (
                  <option key={v.id} value={v.id}>
                    v{v.version}{v.changelog ? ` — ${v.changelog.slice(0, 40)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Environment</label>
              <select
                value={selectedEnv}
                onChange={e => setSelectedEnv(e.target.value as Env)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B2B]"
              >
                {ENV_ORDER.map(env => (
                  <option key={env} value={env} className="capitalize">
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Release notes, changelog, or context..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6B2B] resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting || versions.length === 0}
            className="btn-orange disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? 'Creating...' : 'Create Release'}
          </button>
        </form>
      </div>

      {/* Release Timeline */}
      <div>
        <h3 className="text-base font-semibold mb-4">Release History</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-hard p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="card-hard p-6 text-center text-gray-500 text-sm">
            No releases yet. Create your first release above.
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-700" />
            {releases.map((release, i) => {
              const next = nextEnv(release.environment)
              const releaseDate = new Date(release.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              return (
                <div key={release.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border-2 ${
                      release.environment === 'production'
                        ? 'bg-green-900 border-green-500 text-green-300'
                        : release.environment === 'approved'
                        ? 'bg-blue-900 border-blue-500 text-blue-300'
                        : release.environment === 'review'
                        ? 'bg-amber-900 border-amber-500 text-amber-300'
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}
                  >
                    v{release.version?.version ?? '?'}
                  </div>
                  <div className="card-hard p-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <EnvBadge env={release.environment} />
                      <span className="text-xs text-gray-500">{releaseDate}</span>
                      {release.approvedBy && (
                        <span className="text-xs text-gray-500">Approved</span>
                      )}
                    </div>
                    {release.notes && (
                      <p className="text-sm text-gray-300 mb-3">{release.notes}</p>
                    )}
                    {release.version?.changelog && (
                      <p className="text-xs text-gray-500 mb-3 italic">
                        {release.version.changelog}
                      </p>
                    )}
                    {next && (
                      <button
                        onClick={() => handlePromote(release)}
                        className="text-xs px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors font-medium"
                      >
                        Promote to {next.charAt(0).toUpperCase() + next.slice(1)}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
