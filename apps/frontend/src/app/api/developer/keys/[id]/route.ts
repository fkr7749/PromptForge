import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

// DELETE: revoke key — auth required, must be owner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.apiKey.delete({
      where: { id, userId },
    })
  } catch {
    return NextResponse.json({ error: 'Key not found or not owned by user' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
