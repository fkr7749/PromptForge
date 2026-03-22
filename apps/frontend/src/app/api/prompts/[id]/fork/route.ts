import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@promptforge/database'
import { createNotification } from '@/lib/notifications'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: originalId } = await context.params

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch original prompt with its current version and tags
    const original = await prisma.prompt.findUnique({
      where: { id: originalId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
        tags: {
          select: { tagId: true },
        },
      },
    })

    if (!original) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Resolve the current version content
    let sourceVersion = original.versions[0] ?? null

    // If there is an explicit currentVersionId, prefer that version
    if (original.currentVersionId) {
      const cv = await prisma.promptVersion.findUnique({
        where: { id: original.currentVersionId },
      })
      if (cv) sourceVersion = cv
    }

    // Step 1: Create the forked Prompt (draft, not public)
    const forkedPrompt = await prisma.prompt.create({
      data: {
        title: `Fork of ${original.title}`,
        description: original.description,
        category: original.category,
        isPublic: false,
        isPremium: false,
        authorId: userId,
        forkedFromId: original.id,
      },
    })

    // Step 2: Create the first PromptVersion for the fork
    const forkedVersion = await prisma.promptVersion.create({
      data: {
        promptId: forkedPrompt.id,
        version: 1,
        content: sourceVersion?.content ?? '',
        changelog: `Forked from "${original.title}"`,
        variables: (sourceVersion?.variables ?? []) as Prisma.InputJsonValue,
        authorId: userId,
      },
    })

    // Step 3: Update the forked Prompt's currentVersionId
    await prisma.prompt.update({
      where: { id: forkedPrompt.id },
      data: { currentVersionId: forkedVersion.id },
    })

    // Step 4: Increment original prompt's forkCount
    await prisma.prompt.update({
      where: { id: original.id },
      data: { forkCount: { increment: 1 } },
    })

    // Step 5: Copy tags from original to fork
    if (original.tags.length > 0) {
      await prisma.promptTag.createMany({
        data: original.tags.map(({ tagId }) => ({
          promptId: forkedPrompt.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    // Notify original author about the fork
    if (original.authorId !== userId) {
      createNotification({
        userId: original.authorId,
        type: 'FORK',
        title: 'Prompt forked',
        message: `Your prompt "${original.title}" was forked`,
        data: { promptId: original.id, forkId: forkedPrompt.id },
      }).catch(() => {})
    }

    return NextResponse.json(
      { id: forkedPrompt.id, title: forkedPrompt.title },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/prompts/[id]/fork error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
