import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

// ── GET /api/notifications/count ────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.notification.count({
      where: { userId, read: false },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('GET /api/notifications/count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
