import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

// GET: list user's keys (never return full key)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ keys })
}

// POST: create key
export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json() as { name?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Generate key: pf_live_ + 32 hex chars
  const rawKey = 'pf_live_' + randomBytes(16).toString('hex')
  const prefix = rawKey.slice(0, 16) + '...' // Show first 16 chars
  const hashedKey = await bcrypt.hash(rawKey, 10)

  const key = await prisma.apiKey.create({
    data: { userId, name: name.trim(), key: hashedKey, prefix },
  })

  // Return full key ONCE — never again
  return NextResponse.json(
    { id: key.id, name: key.name, prefix: key.prefix, key: rawKey, createdAt: key.createdAt },
    { status: 201 }
  )
}
