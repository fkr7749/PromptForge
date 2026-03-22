import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collections = await prisma.collection.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { addedAt: 'desc' },
          include: {
            prompt: {
              select: { id: true, title: true, category: true, upvoteCount: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('GET /api/collections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { name?: string; description?: string; isPublic?: boolean }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description, isPublic } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'name is required and must be between 1 and 100 characters' },
        { status: 400 },
      )
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        isPublic: typeof isPublic === 'boolean' ? isPublic : false,
        ownerId: userId,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('POST /api/collections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
