import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

// ── POST /api/notifications/read ────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { ids?: string[]; all?: boolean }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { ids, all } = body

    if (all) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId, id: { in: ids } },
        data: { read: true },
      })
    } else {
      return NextResponse.json(
        { error: 'Provide "ids" array or set "all" to true' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notifications/read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
