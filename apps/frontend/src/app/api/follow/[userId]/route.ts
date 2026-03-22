import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

type RouteContext = { params: Promise<{ userId: string }> }

// ── GET /api/users/[userId]/follow ──────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { userId: targetUserId } = await context.params

    const currentUserId = getUserIdFromRequest(request)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    })

    return NextResponse.json({ following: !!existingFollow })
  } catch (error) {
    console.error('GET /api/users/[userId]/follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/users/[userId]/follow ─────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { userId: targetUserId } = await context.params

    const currentUserId = getUserIdFromRequest(request)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    })

    let following: boolean

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      })
      following = false
    } else {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      })
      following = true

      // Notify the target user about the new follow
      createNotification({
        userId: targetUserId,
        type: 'FOLLOW',
        title: 'New follower',
        message: 'Someone followed you',
        data: { followerId: currentUserId },
      }).catch(() => {}) // fire and forget
    }

    const followerCount = await prisma.follow.count({
      where: { followingId: targetUserId },
    })

    return NextResponse.json({ following, followerCount })
  } catch (error) {
    console.error('POST /api/users/[userId]/follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
