import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collection = await prisma.collection.findUnique({ where: { id } })
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (collection.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { promptId?: string }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { promptId } = body

    if (!promptId || typeof promptId !== 'string') {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }

    // Check prompt exists
    const prompt = await prisma.prompt.findUnique({ where: { id: promptId } })
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    try {
      await prisma.collectionItem.create({
        data: {
          collectionId: id,
          promptId,
        },
      })
    } catch (error: unknown) {
      // Unique constraint violation
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json({ error: 'Already in collection' }, { status: 409 })
      }
      throw error
    }

    // Touch collection updatedAt
    await prisma.collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/collections/[id]/items error:', error)
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

    const collection = await prisma.collection.findUnique({ where: { id } })
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    if (collection.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { promptId?: string }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { promptId } = body

    if (!promptId || typeof promptId !== 'string') {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }

    await prisma.collectionItem.delete({
      where: {
        collectionId_promptId: {
          collectionId: id,
          promptId,
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/collections/[id]/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
