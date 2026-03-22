import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

function toYaml(obj: Record<string, unknown>, indent = 0): string {
  const spaces = '  '.repeat(indent)
  return Object.entries(obj).map(([k, v]) => {
    if (v === null || v === undefined) return `${spaces}${k}: null`
    if (typeof v === 'string') {
      if (v.includes('\n')) return `${spaces}${k}: |\n${v.split('\n').map(l => `${spaces}  ${l}`).join('\n')}`
      return `${spaces}${k}: "${v.replace(/"/g, '\\"')}"`
    }
    if (typeof v === 'number' || typeof v === 'boolean') return `${spaces}${k}: ${v}`
    if (Array.isArray(v)) {
      if (v.length === 0) return `${spaces}${k}: []`
      if (typeof v[0] === 'string') return `${spaces}${k}:\n${v.map(i => `${spaces}  - "${i}"`).join('\n')}`
      return `${spaces}${k}:\n${v.map(i => `${spaces}  -\n${toYaml(i as Record<string, unknown>, indent + 2)}`).join('\n')}`
    }
    if (typeof v === 'object') return `${spaces}${k}:\n${toYaml(v as Record<string, unknown>, indent + 1)}`
    return `${spaces}${k}: ${v}`
  }).join('\n')
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') === 'json' ? 'json' : 'yaml'

    const prompt = await prisma.prompt.findUnique({
      where: { id, isPublic: true },
      include: {
        versions: {
          orderBy: { version: 'asc' },
          select: {
            version: true,
            content: true,
            changelog: true,
            variables: true,
            createdAt: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: { slug: true },
            },
          },
        },
        author: {
          select: { username: true },
        },
      },
    })

    if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const latestVersion = prompt.versions[prompt.versions.length - 1]

    const exportData = {
      promptforge: '1.0',
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      author: prompt.author.username,
      tags: prompt.tags.map(t => t.tag.slug),
      variables: latestVersion?.variables ?? [],
      versions: prompt.versions.map(v => ({
        version: v.version,
        content: v.content,
        changelog: v.changelog ?? 'Initial version',
      })),
      exportedAt: new Date().toISOString(),
    }

    const filename = prompt.title.replace(/[^a-z0-9]/gi, '_')

    if (format === 'json') {
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    const content = toYaml(exportData as unknown as Record<string, unknown>)

    return new Response(content, {
      headers: {
        'Content-Type': 'text/yaml',
        'Content-Disposition': `attachment; filename="${filename}.yaml"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Export failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
