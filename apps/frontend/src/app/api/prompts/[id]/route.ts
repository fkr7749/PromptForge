import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { PromptCategory, Prisma } from '@promptforge/database'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isPremium: true,
            _count: {
              select: {
                prompts: true,
                followers: true,
              },
            },
          },
        },
        versions: {
          orderBy: { version: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
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
        forkedFrom: {
          select: {
            id: true,
            title: true,
            author: {
              select: { username: true },
            },
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            content: true,
            upvotes: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: { replies: true },
            },
          },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Increment viewCount (fire-and-forget, non-blocking)
    prisma.prompt
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment viewCount:', err))

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('GET /api/prompts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.prompt.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }
    if (existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: {
      title?: string
      description?: string
      category?: string
      isPublic?: boolean
      isPremium?: boolean
      price?: number | null
      content?: string
      changelog?: string
      variables?: Prisma.InputJsonValue
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, description, category, isPublic, isPremium, price, content, changelog, variables } =
      body

    // Validate category if provided
    if (category !== undefined && !(category in PromptCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${Object.keys(PromptCategory).join(', ')}` },
        { status: 400 },
      )
    }

    const updateData: Prisma.PromptUpdateInput = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (category !== undefined) updateData.category = category as PromptCategory
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic
    if (typeof isPremium === 'boolean') updateData.isPremium = isPremium
    if (price !== undefined) updateData.price = price

    // If content is provided, create a new version
    if (content !== undefined && content.trim().length > 0) {
      const latestVersion = await prisma.promptVersion.findFirst({
        where: { promptId: id },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      const nextVersion = (latestVersion?.version ?? 0) + 1

      const newVersion = await prisma.promptVersion.create({
        data: {
          promptId: id,
          version: nextVersion,
          content: content.trim(),
          changelog: changelog ?? `Version ${nextVersion}`,
          variables: (variables ?? []) as Prisma.InputJsonValue,
          authorId: userId,
        },
      })

      updateData.currentVersionId = newVersion.id
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: updateData,
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
      },
    })

    const { upsertPromptEmbedding } = await import('@/lib/embeddings')
    upsertPromptEmbedding(
      id,
      `${updateData.title || ''} ${updateData.description || ''}`
    ).catch(console.error)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/prompts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.prompt.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }
    if (existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.prompt.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/prompts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
