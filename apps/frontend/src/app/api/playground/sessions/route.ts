import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ sessions: [] })

  const sessions = await prisma.playgroundSession.findMany({
    where: { userId },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    take: 20,
  })

  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, promptContent, systemPrompt, variableValues, selectedModels, temperature, maxTokens, title } = body

  // Upsert session by id if provided (update), otherwise create
  if (id) {
    const session = await prisma.playgroundSession.upsert({
      where: { id },
      update: { promptContent, systemPrompt, variableValues, selectedModels, temperature, maxTokens, title },
      create: { id, userId, promptContent, systemPrompt: systemPrompt ?? '', variableValues: variableValues ?? {}, selectedModels: selectedModels ?? [], temperature: temperature ?? 0.7, maxTokens: maxTokens ?? 2048, title },
    })
    return NextResponse.json({ session })
  }

  const session = await prisma.playgroundSession.create({
    data: { userId, promptContent, systemPrompt: systemPrompt ?? '', variableValues: variableValues ?? {}, selectedModels: selectedModels ?? [], temperature: temperature ?? 0.7, maxTokens: maxTokens ?? 2048, title },
  })
  return NextResponse.json({ session })
}
