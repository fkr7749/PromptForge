import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

async function findOrCreateSaved(userId: string) {
  let savedCollection = await prisma.collection.findFirst({
    where: { ownerId: userId, name: 'Saved' },
  })
  if (!savedCollection) {
    savedCollection = await prisma.collection.create({
      data: {
        name: 'Saved',
        description: 'Your saved prompts',
        isPublic: false,
        ownerId: userId,
      },
    })
  }
  return savedCollection
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const savedCollection = await findOrCreateSaved(userId)

    const items = await prisma.collectionItem.findMany({
      where: { collectionId: savedCollection.id },
      orderBy: { addedAt: 'desc' },
      include: {
        prompt: {
          include: {
            author: { select: { username: true, displayName: true } },
            tags: { include: { tag: true } },
            _count: { select: { executions: true, upvotes: true, forks: true } },
          },
        },
      },
    })

    return NextResponse.json({ collectionId: savedCollection.id, items })
  } catch (error) {
    console.error('GET /api/users/me/saved error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { promptId?: string; action?: 'add' | 'remove' }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { promptId, action } = body

    if (!promptId || typeof promptId !== 'string') {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }
    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'action must be "add" or "remove"' }, { status: 400 })
    }

    const savedCollection = await findOrCreateSaved(userId)

    if (action === 'add') {
      // Verify prompt exists
      const prompt = await prisma.prompt.findUnique({ where: { id: promptId } })
      if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

      try {
        await prisma.collectionItem.create({
          data: { collectionId: savedCollection.id, promptId },
        })
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          return NextResponse.json({ message: 'Already saved' }, { status: 200 })
        }
        throw err
      }

      await prisma.collection.update({
        where: { id: savedCollection.id },
        data: { updatedAt: new Date() },
      })

      return NextResponse.json({ success: true }, { status: 201 })
    } else {
      // remove
      try {
        await prisma.collectionItem.delete({
          where: {
            collectionId_promptId: {
              collectionId: savedCollection.id,
              promptId,
            },
          },
        })
      } catch {
        // Item may not exist; treat as success
      }

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('POST /api/users/me/saved error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
