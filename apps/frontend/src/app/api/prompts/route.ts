import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { PromptCategory, Prisma } from '@promptforge/database'

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const categoryParam = searchParams.get('category')
    const sort = searchParams.get('sort') ?? 'newest'
    const q = searchParams.get('q')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limitRaw = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
    const limit = Math.min(isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, MAX_LIMIT)
    const tagsParam = searchParams.get('tags')
    const isPremiumParam = searchParams.get('isPremium')

    const where: Prisma.PromptWhereInput = {
      isPublic: true,
    }

    // Category filter
    if (categoryParam && categoryParam in PromptCategory) {
      where.category = categoryParam as PromptCategory
    }

    // Search in title + description
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Tag filter by slugs
    if (tagsParam) {
      const slugs = tagsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (slugs.length > 0) {
        where.tags = {
          some: {
            tag: {
              slug: { in: slugs },
            },
          },
        }
      }
    }

    // isPremium filter
    if (isPremiumParam === 'true') {
      where.isPremium = true
    } else if (isPremiumParam === 'false') {
      where.isPremium = false
    }

    // Sort order
    let orderBy: Prisma.PromptOrderByWithRelationInput
    switch (sort) {
      case 'popular':
        orderBy = { upvoteCount: 'desc' }
        break
      case 'trending':
        orderBy = { viewCount: 'desc' }
        break
      case 'forked':
        orderBy = { forkCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const skip = (page - 1) * limit

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
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
            select: {
              content: true,
              variables: true,
            },
          },
        },
      }),
      prisma.prompt.count({ where }),
    ])

    // Shape the latestVersion field — truncate content to 200 chars
    const shaped = prompts.map((prompt) => {
      const { versions, ...rest } = prompt
      const latestVersion =
        versions.length > 0
          ? {
              content: versions[0]!.content.slice(0, 200),
              variables: versions[0]!.variables,
            }
          : null
      return { ...rest, latestVersion }
    })

    return NextResponse.json({
      prompts: shaped,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      title?: string
      description?: string
      category?: string
      content?: string
      variables?: Array<{ name: string; description?: string; default?: string }>
      tags?: string[]
      isPublic?: boolean
      isPremium?: boolean
      price?: number
      systemPrompt?: string
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, description, category, content, variables, tags, isPublic, isPremium, price } =
      body

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }
    if (!category || !(category in PromptCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${Object.keys(PromptCategory).join(', ')}` },
        { status: 400 },
      )
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Step 1: Create the Prompt record (without currentVersionId first)
    const prompt = await prisma.prompt.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category as PromptCategory,
        isPublic: typeof isPublic === 'boolean' ? isPublic : true,
        isPremium: typeof isPremium === 'boolean' ? isPremium : false,
        price: price != null ? price : undefined,
        authorId: userId,
      },
    })

    // Step 2: Create the first PromptVersion
    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 1,
        content: content.trim(),
        changelog: 'Initial version',
        variables: (variables ?? []) as Prisma.InputJsonValue,
        authorId: userId,
      },
    })

    // Step 3: Update Prompt.currentVersionId
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: version.id },
    })

    // Step 4: Upsert tags and connect via PromptTag
    if (tags && tags.length > 0) {
      for (const slug of tags) {
        const trimmedSlug = slug.trim()
        if (!trimmedSlug) continue

        const tag = await prisma.tag.upsert({
          where: { slug: trimmedSlug },
          update: { count: { increment: 1 } },
          create: {
            name: trimmedSlug,
            slug: trimmedSlug,
            count: 1,
          },
        })

        await prisma.promptTag.upsert({
          where: { promptId_tagId: { promptId: prompt.id, tagId: tag.id } },
          update: {},
          create: { promptId: prompt.id, tagId: tag.id },
        })
      }
    }

    // Step 5: Return the full prompt with relations
    const result = await prisma.prompt.findUnique({
      where: { id: prompt.id },
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
        versions: {
          orderBy: { version: 'asc' },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
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
      },
    })

    // Fire-and-forget embedding generation
    const { upsertPromptEmbedding } = await import('@/lib/embeddings')
    upsertPromptEmbedding(
      prompt.id,
      `${prompt.title} ${prompt.description} ${content}`
    ).catch(console.error)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
