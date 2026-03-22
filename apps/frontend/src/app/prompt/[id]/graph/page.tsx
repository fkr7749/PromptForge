'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface GraphNode {
  id: string
  label: string
  type: 'prompt' | 'version' | 'fork' | 'parent'
  upvoteCount?: number
  author?: string
  isCurrent: boolean
  changelog?: string
  x?: number
  y?: number
}

interface GraphEdge {
  source: string
  target: string
  type: 'fork' | 'version'
}

export default function PromptGraphPage() {
  const params = useParams()
  const router = useRouter()
  const promptId = params.id as string
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null)
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/graph`)
      .then(r => r.json())
      .then(data => {
        // Simple layout: circular for versions, left for parent, right for forks
        const nodes = data.nodes as GraphNode[]
        const centerX = 400, centerY = 300

        nodes.forEach(n => {
          if (n.isCurrent && n.type === 'prompt') { n.x = centerX; n.y = centerY }
          else if (n.type === 'parent') { n.x = centerX - 300; n.y = centerY }
          else if (n.type === 'fork') {
            const forks = nodes.filter(nn => nn.type === 'fork')
            const i = forks.indexOf(n)
            n.x = centerX + 280
            n.y = centerY - ((forks.length - 1) * 60) / 2 + i * 60
          }
          else if (n.type === 'version') {
            const versions = nodes.filter(nn => nn.type === 'version')
            const i = versions.indexOf(n)
            n.x = centerX - 100 + i * 80
            n.y = centerY + 200
          }
        })
        setGraph({ nodes, edges: data.edges })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [promptId])

  if (loading) return (
    <div className="min-h-screen bg-forge-ink flex items-center justify-center">
      <div className="text-white">Loading graph...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-forge-ink pt-20">
      <div className="container-forge py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-forge-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-white">Prompt Dependency Graph</h1>
        </div>

        <div className="flex gap-6">
          {/* SVG Graph */}
          <div className="flex-1 card-hard rounded-xl overflow-hidden" style={{ minHeight: 500 }}>
            <svg viewBox="0 0 800 600" className="w-full h-full" style={{ minHeight: 500 }}>
              {/* Arrow marker */}
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                </marker>
              </defs>

              {/* Edges */}
              {graph?.edges.map((e, i) => {
                const src = graph.nodes.find(n => n.id === e.source)
                const tgt = graph.nodes.find(n => n.id === e.target)
                if (!src?.x || !tgt?.x) return null
                return (
                  <line
                    key={i}
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={e.type === 'fork' ? '#FF6B2B' : '#666'}
                    strokeWidth={e.type === 'fork' ? 2 : 1}
                    strokeDasharray={e.type === 'fork' ? '6,3' : undefined}
                    markerEnd="url(#arrow)"
                  />
                )
              })}

              {/* Nodes */}
              {graph?.nodes.map((n) => {
                if (!n.x) return null
                const isVersion = n.type === 'version'
                const r = isVersion ? 20 : 45
                const fill = n.isCurrent
                  ? '#FF6B2B'
                  : n.type === 'fork'
                  ? '#2a2a2a'
                  : n.type === 'parent'
                  ? '#1a1a2e'
                  : '#1e1e1e'
                const stroke = n.isCurrent ? '#FF6B2B' : '#444'
                return (
                  <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(n)}>
                    {isVersion ? (
                      <rect
                        x={(n.x ?? 0) - r}
                        y={(n.y ?? 0) - 14}
                        width={r * 2}
                        height={28}
                        rx={6}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={selected?.id === n.id ? 2 : 1}
                      />
                    ) : (
                      <ellipse
                        cx={n.x}
                        cy={n.y}
                        rx={r}
                        ry={28}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={selected?.id === n.id ? 2 : 1}
                      />
                    )}
                    <text
                      x={n.x}
                      y={(n.y ?? 0) + 4}
                      textAnchor="middle"
                      fill={n.isCurrent ? 'white' : '#ccc'}
                      fontSize={isVersion ? 11 : 10}
                      fontWeight={n.isCurrent ? 'bold' : 'normal'}
                    >
                      {n.label.slice(0, 12)}{n.label.length > 12 ? '…' : ''}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Detail Panel */}
          <div className="w-72 space-y-4">
            {/* Legend */}
            <div className="card-hard rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Legend</h3>
              <div className="space-y-2 text-xs text-forge-muted">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-forge-orange inline-block" />
                  Current prompt
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-gray-700 inline-block" />
                  Fork
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-900 inline-block" />
                  Parent prompt
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-2 rounded bg-gray-600 inline-block" />
                  Version
                </div>
                <hr className="border-forge-border" />
                <div className="flex items-center gap-2">
                  <span className="text-forge-orange font-mono">- - -</span>
                  Fork edge
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">———</span>
                  Version edge
                </div>
              </div>
            </div>

            {/* Selected node detail */}
            {selected ? (
              <div className="card-hard rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2 truncate">{selected.label}</h3>
                <div className="text-xs text-forge-muted space-y-1">
                  <div>
                    Type: <span className="text-white capitalize">{selected.type}</span>
                  </div>
                  {selected.author && (
                    <div>
                      Author: <span className="text-white">@{selected.author}</span>
                    </div>
                  )}
                  {selected.upvoteCount !== undefined && (
                    <div>
                      Upvotes: <span className="text-forge-orange font-bold">{selected.upvoteCount}</span>
                    </div>
                  )}
                  {selected.changelog && (
                    <div>
                      Changelog: <span className="text-white">{selected.changelog}</span>
                    </div>
                  )}
                </div>
                {selected.type !== 'version' && (
                  <Link
                    href={`/prompt/${selected.id}`}
                    className="mt-3 flex items-center gap-1 text-xs text-forge-orange hover:underline"
                  >
                    View Prompt <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            ) : (
              <div className="card-hard rounded-xl p-4 text-center text-forge-muted text-xs">
                Click a node to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
