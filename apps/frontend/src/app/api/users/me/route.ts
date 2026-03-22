import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import bcryptjs from 'bcryptjs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            prompts: true,
            followers: true,
            following: true,
            collections: true,
            executions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sum upvoteCounts across all user prompts
    const agg = await prisma.prompt.aggregate({
      where: { authorId: userId },
      _sum: { upvoteCount: true },
    })

    const totalUpvotesReceived = agg._sum.upvoteCount ?? 0

    // avgRating: upvoteCount / 100, capped at 5.0
    const rawRating = totalUpvotesReceived / 100
    const avgRating = Math.min(parseFloat(rawRating.toFixed(1)), 5.0)

    // Recent 10 executions with prompt title
    const recentExecutions = await prisma.promptExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        prompt: {
          select: { id: true, title: true },
        },
      },
    })

    const { _count, ...userFields } = user

    return NextResponse.json({
      user: {
        id: userFields.id,
        username: userFields.username,
        displayName: userFields.displayName,
        email: userFields.email,
        avatarUrl: userFields.avatarUrl,
        bio: userFields.bio,
        website: userFields.website,
        isPremium: userFields.isPremium,
        role: userFields.role,
        eloRating: userFields.eloRating,
        totalEarnings: userFields.totalEarnings,
        createdAt: userFields.createdAt,
      },
      stats: {
        promptsCreated: _count.prompts,
        totalRuns: _count.executions,
        avgRating,
        collections: _count.collections,
        followers: _count.followers,
        following: _count.following,
        totalUpvotesReceived,
      },
      recentExecutions,
    })
  } catch (error) {
    console.error('GET /api/users/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { displayName?: string; bio?: string; website?: string; avatarUrl?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { displayName, bio, website, avatarUrl } = body
    const data: Record<string, string> = {}

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.trim().length > 100) {
        return NextResponse.json({ error: 'displayName must be 1-100 characters' }, { status: 400 })
      }
      data.displayName = displayName.trim()
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        return NextResponse.json({ error: 'bio must be 500 characters or fewer' }, { status: 400 })
      }
      data.bio = bio.trim()
    }
    if (website !== undefined) {
      data.website = website.trim() || ''
    }
    if (avatarUrl !== undefined) {
      data.avatarUrl = avatarUrl.trim() || ''
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, email: true, bio: true, website: true, avatarUrl: true },
      data,
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('PUT /api/users/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      displayName?: string
      username?: string
      bio?: string
      website?: string
      githubUrl?: string
      twitterUrl?: string
      avatarUrl?: string
      currentPassword?: string
      newPassword?: string
      email?: string
      onboardingCompleted?: boolean
      userType?: string
      emailDigestEnabled?: boolean
      notificationPreferences?: Record<string, boolean>
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Password change flow
    if (body.currentPassword !== undefined || body.newPassword !== undefined) {
      if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json({ error: 'Both currentPassword and newPassword are required' }, { status: 400 })
      }
      if (body.newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 400 })
      }

      const valid = await bcryptjs.compare(body.currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const newHash = await bcryptjs.hash(body.newPassword, 12)
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })
      return NextResponse.json({ success: true, message: 'Password updated' })
    }

    // Profile + settings update
    const data: Record<string, unknown> = {}

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0 || body.displayName.trim().length > 100) {
        return NextResponse.json({ error: 'displayName must be 1-100 characters' }, { status: 400 })
      }
      data.displayName = body.displayName.trim()
    }

    if (body.username !== undefined) {
      if (typeof body.username !== 'string' || !/^[a-z0-9_-]{3,30}$/.test(body.username)) {
        return NextResponse.json({ error: 'Username must be 3-30 lowercase alphanumeric characters, underscores or hyphens' }, { status: 400 })
      }
      const existing = await prisma.user.findFirst({ where: { username: body.username, NOT: { id: userId } } })
      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }
      data.username = body.username
    }

    if (body.bio !== undefined) {
      if (typeof body.bio !== 'string' || body.bio.length > 500) {
        return NextResponse.json({ error: 'Bio must be 500 characters or fewer' }, { status: 400 })
      }
      data.bio = body.bio.trim()
    }

    if (body.website !== undefined) data.website = typeof body.website === 'string' ? body.website.trim() : ''
    if (body.githubUrl !== undefined) data.githubUrl = typeof body.githubUrl === 'string' ? body.githubUrl.trim() : ''
    if (body.twitterUrl !== undefined) data.twitterUrl = typeof body.twitterUrl === 'string' ? body.twitterUrl.trim() : ''
    if (body.avatarUrl !== undefined) data.avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : ''
    if (body.onboardingCompleted !== undefined) data.onboardingCompleted = Boolean(body.onboardingCompleted)
    if (body.userType !== undefined) data.userType = body.userType
    if (body.emailDigestEnabled !== undefined) data.emailDigestEnabled = Boolean(body.emailDigestEnabled)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        website: true,
        githubUrl: true,
        twitterUrl: true,
        avatarUrl: true,
        emailDigestEnabled: true,
        onboardingCompleted: true,
        userType: true,
      },
      data,
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('PATCH /api/users/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
