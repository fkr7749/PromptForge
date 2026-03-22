import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const userId = getUserIdFromRequest(request)

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
        _count: { select: { items: true } },
        items: {
          orderBy: { addedAt: 'desc' },
          include: {
            prompt: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                upvoteCount: true,
                forkCount: true,
                author: { select: { id: true, username: true, displayName: true } },
                tags: { include: { tag: { select: { name: true, slug: true } } } },
              },
            },
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    if (!collection.isPublic && collection.owner.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error)
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

    const existing = await prisma.collection.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (existing.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { name?: string; description?: string; isPublic?: boolean }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description, isPublic } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100)) {
      return NextResponse.json(
        { error: 'name must be between 1 and 100 characters' },
        { status: 400 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() ?? null
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic

    const updated = await prisma.collection.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/collections/[id] error:', error)
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

    const existing = await prisma.collection.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (existing.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.collection.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/collections/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
