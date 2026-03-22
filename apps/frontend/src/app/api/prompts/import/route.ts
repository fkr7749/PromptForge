import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { PromptCategory } from '@promptforge/database'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as {
      data?: {
        title?: string
        description?: string
        category?: string
        versions?: Array<{ content: string; changelog?: string }>
        tags?: string[]
        variables?: unknown[]
      }
      // Also accept flat format for backwards compatibility
      title?: string
      description?: string
      category?: string
      content?: string
      tags?: string[]
      variables?: unknown[]
      changelog?: string
    }

    // Support both { data: { ... } } wrapper and flat format
    const source = body.data ?? body
    const title = source.title
    const description = source.description
    const category = source.category
    const content = body.data
      ? body.data.versions?.[0]?.content
      : (body as { content?: string }).content
    const tags = source.tags
    const variables = source.variables
    const changelog = body.data
      ? (body.data.versions?.[0] as { changelog?: string } | undefined)?.changelog
      : (body as { changelog?: string }).changelog

    // Validate required fields
    if (!title || !description || !category || !content) {
      return NextResponse.json(
        { error: 'title, description, category, and versions[0].content are required' },
        { status: 400 },
      )
    }

    // Validate category
    const upperCategory = category.toUpperCase()
    if (!(upperCategory in PromptCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create prompt + version
    const prompt = await prisma.prompt.create({
      data: {
        title,
        description,
        category: upperCategory as PromptCategory,
        authorId: userId,
        isPublic: true,
      },
    })

    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 1,
        content,
        changelog: changelog ?? 'Imported',
        variables: (variables ?? []) as object[],
        authorId: userId,
      },
    })

    await prisma.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: version.id },
    })

    // Handle tags
    if (tags && tags.length > 0) {
      for (const slug of tags) {
        const tag = await prisma.tag.upsert({
          where: { slug },
          update: { count: { increment: 1 } },
          create: { name: slug, slug, count: 1 },
        })
        await prisma.promptTag.upsert({
          where: { promptId_tagId: { promptId: prompt.id, tagId: tag.id } },
          update: {},
          create: { promptId: prompt.id, tagId: tag.id },
        })
      }
    }

    return NextResponse.json({ id: prompt.id, title: prompt.title }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
