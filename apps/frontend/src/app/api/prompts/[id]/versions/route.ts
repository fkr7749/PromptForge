import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@promptforge/database'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: promptId } = await context.params

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true },
    })
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const versions = await prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { version: 'asc' },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('GET /api/prompts/[id]/versions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: promptId } = await context.params

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, authorId: true },
    })
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }
    if (prompt.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: {
      content?: string
      changelog?: string
      variables?: Prisma.InputJsonValue
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { content, changelog, variables } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Get the current maximum version number
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const nextVersion = (latestVersion?.version ?? 0) + 1

    // Create the new version
    const newVersion = await prisma.promptVersion.create({
      data: {
        promptId,
        version: nextVersion,
        content: content.trim(),
        changelog: changelog?.trim() ?? `Version ${nextVersion}`,
        variables: (variables ?? []) as Prisma.InputJsonValue,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    // Update Prompt.currentVersionId to the new version
    await prisma.prompt.update({
      where: { id: promptId },
      data: { currentVersionId: newVersion.id },
    })

    return NextResponse.json(newVersion, { status: 201 })
  } catch (error) {
    console.error('POST /api/prompts/[id]/versions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
