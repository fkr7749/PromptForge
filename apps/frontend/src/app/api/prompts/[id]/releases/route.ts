import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id: promptId } = await ctx.params
  const releases = await prisma.promptRelease.findMany({
    where: { promptId },
    orderBy: { createdAt: 'desc' },
  })
  // Fetch version info for each release
  const versionIds = [...new Set(releases.map(r => r.versionId))]
  const versions = await prisma.promptVersion.findMany({
    where: { id: { in: versionIds } },
    select: { id: true, version: true, changelog: true },
  })
  const versionMap = Object.fromEntries(versions.map(v => [v.id, v]))
  return NextResponse.json(releases.map(r => ({ ...r, version: versionMap[r.versionId] })))
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: promptId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { authorId: true } })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prompt.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { versionId, environment, notes } = await req.json()
  const validEnvs = ['draft', 'review', 'approved', 'production']
  if (!validEnvs.includes(environment)) return NextResponse.json({ error: 'Invalid environment' }, { status: 400 })

  const release = await prisma.promptRelease.create({
    data: { promptId, versionId, environment, notes, createdBy: userId },
  })
  return NextResponse.json(release, { status: 201 })
}
