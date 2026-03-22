import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

const VALID_ROLES = ['USER', 'CREATOR', 'MODERATOR', 'ADMIN']

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const q = searchParams.get('q') ?? ''
    const roleFilter = searchParams.get('role') ?? ''

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (roleFilter && VALID_ROLES.includes(roleFilter)) {
      where.role = roleFilter
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          isPremium: true,
          createdAt: true,
          _count: {
            select: {
              prompts: true,
              followers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { userId, role } = body as { userId?: string; role?: string }

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
    }

    // Safety: cannot change own role
    if (userId === auth.userId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isPremium: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Admin role update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
