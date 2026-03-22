import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { prompts: true },
        },
      },
      orderBy: { count: 'desc' },
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('GET /api/tags error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
