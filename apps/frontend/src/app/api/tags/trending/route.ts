import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  // Get tags that have had the most new prompts in the last 7 days
  const trending = await prisma.$queryRaw<Array<{ name: string; slug: string; recent_count: bigint; total_count: number }>>`
    SELECT t.name, t.slug, t.count as total_count, COUNT(pt."promptId") as recent_count
    FROM tags t
    LEFT JOIN prompt_tags pt ON pt."tagId" = t.id
    LEFT JOIN prompts p ON p.id = pt."promptId" AND p."createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY t.id, t.name, t.slug, t.count
    ORDER BY recent_count DESC, t.count DESC
    LIMIT 12
  `

  return NextResponse.json(trending.map(t => ({
    name: t.name,
    slug: t.slug,
    totalCount: t.total_count,
    recentCount: Number(t.recent_count),
  })))
}
