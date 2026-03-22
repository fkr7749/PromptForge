import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')?.toLowerCase().trim()

    if (!username) {
      return NextResponse.json({ error: 'username param required' }, { status: 400 })
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json({ available: false, error: 'Username must be 3-30 lowercase alphanumeric characters, underscores or hyphens' })
    }

    const existing = await prisma.user.findFirst({
      where: {
        username,
        ...(userId ? { NOT: { id: userId } } : {}),
      },
      select: { id: true },
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('GET /api/users/check-username error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
