import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CATEGORY_COLORS: Record<string, string> = {
  CODING: '#3B82F6', WRITING: '#22C55E', BUSINESS: '#A855F7',
  ANALYSIS: '#EAB308', EDUCATION: '#EC4899', CREATIVITY: '#FF6B2B',
  RESEARCH: '#06B6D4', ROLEPLAY: '#F43F5E', OTHER: '#6B7280',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      category: true,
      upvoteCount: true,
      forkCount: true,
      viewCount: true,
      author: { select: { displayName: true, username: true } },
      _count: { select: { executions: true } },
    },
  })

  if (!prompt) {
    return new Response('Not found', { status: 404 })
  }

  const catColor = CATEGORY_COLORS[prompt.category] ?? '#6B7280'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          backgroundColor: '#0A0A0A',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Orange left accent bar */}
        <div style={{ width: '8px', height: '100%', backgroundColor: '#FF6B2B', flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '60px', flex: 1 }}>
          {/* Category badge */}
          <div style={{ display: 'flex', marginBottom: '24px' }}>
            <div style={{
              backgroundColor: catColor + '20',
              border: `1px solid ${catColor}50`,
              color: catColor,
              padding: '6px 16px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {prompt.category}
            </div>
          </div>

          {/* Title */}
          <div style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            maxWidth: '900px',
          }}>
            {prompt.title.length > 60 ? prompt.title.slice(0, 60) + '\u2026' : prompt.title}
          </div>

          {/* Description */}
          <div style={{
            fontSize: '24px',
            color: '#9B9B9B',
            marginBottom: 'auto',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}>
            {prompt.description.length > 120 ? prompt.description.slice(0, 120) + '\u2026' : prompt.description}
          </div>

          {/* Footer row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Stats */}
            <div style={{ display: 'flex', gap: '32px' }}>
              {[
                { label: 'Upvotes', value: prompt.upvoteCount },
                { label: 'Forks', value: prompt.forkCount },
                { label: 'Runs', value: prompt._count.executions },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#FF6B2B' }}>{stat.value.toLocaleString()}</div>
                  <div style={{ fontSize: '14px', color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Author + Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ fontSize: '18px', color: '#6B6B6B' }}>by @{prompt.author.username}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#FF6B2B', letterSpacing: '-0.02em' }}>PROMPTFORGE</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
