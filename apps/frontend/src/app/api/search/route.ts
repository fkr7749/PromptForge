import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@promptforge/database'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '12'), 50)
  const mode = searchParams.get('mode') ?? 'text'
  const semanticAvailable = !!process.env.OPENAI_API_KEY

  if (!q || q.length < 2) {
    return NextResponse.json({ prompts: [], query: q, total: 0 })
  }

  if (mode === 'semantic' && semanticAvailable && q.length >= 2) {
    try {
      const { generateEmbedding } = await import('@/lib/embeddings')
      const embedding = await generateEmbedding(q)
      if (embedding) {
        const vectorString = '[' + embedding.join(',') + ']'
        const semanticResults = await prisma.$queryRaw<Array<{
          id: string; title: string; description: string; category: string;
          upvoteCount: number; viewCount: number; authorId: string;
          username: string; displayName: string; avatarUrl: string | null;
          similarity: number
        }>>`
          SELECT p.id, p.title, p.description, p.category, p."upvoteCount", p."viewCount", p."authorId",
                 u.username, u."displayName", u."avatarUrl",
                 1 - (pe.embedding <=> ${vectorString}::vector) as similarity
          FROM prompt_embeddings pe
          JOIN prompts p ON p.id = pe."promptId"
          JOIN users u ON u.id = p."authorId"
          WHERE p."isPublic" = true
          ORDER BY pe.embedding <=> ${vectorString}::vector
          LIMIT ${limit}
        `
        return NextResponse.json({
          prompts: semanticResults.map(r => ({
            id: r.id, title: r.title, description: r.description, category: r.category,
            upvoteCount: r.upvoteCount, viewCount: r.viewCount, authorId: r.authorId,
            author: { username: r.username, displayName: r.displayName, avatarUrl: r.avatarUrl },
            similarity: r.similarity, tags: [], latestVersion: null,
          })),
          query: q, total: semanticResults.length, mode: 'semantic', semanticAvailable,
        })
      }
    } catch (e) {
      console.error('Semantic search failed, falling back:', e)
    }
  }

  // Find matching tags first
  const matchingTags = await prisma.tag.findMany({
    where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] },
    select: { id: true },
    take: 10,
  })
  const tagIds = matchingTags.map(t => t.id)

  // Search prompts with full-text across title, description, and matching tags
  const where: Prisma.PromptWhereInput = {
    isPublic: true,
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
    ],
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      take: limit,
      // Sort by text match relevance approximation: title matches first (upvoteCount as tie-breaker)
      orderBy: [{ upvoteCount: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPremium: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            upvotes: true,
            comments: true,
            forks: true,
            executions: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { content: true, variables: true },
        },
      },
    }),
    prisma.prompt.count({ where }),
  ])

  const shaped = prompts.map(p => {
    const { versions, ...rest } = p
    return {
      ...rest,
      latestVersion: versions[0]
        ? { content: versions[0].content.slice(0, 200), variables: versions[0].variables }
        : null,
    }
  })

  return NextResponse.json({ prompts: shaped, query: q, total, semanticAvailable })
}
