import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: challengeId } = await params

  // Check challenge exists and is active
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { id: challengeId },
  })

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  if (challenge.status !== 'active') {
    return NextResponse.json({ error: 'Challenge is no longer active' }, { status: 400 })
  }

  // Parse body
  let promptId: string
  try {
    const body = await req.json()
    promptId = body.promptId
    if (!promptId) throw new Error('Missing promptId')
  } catch {
    return NextResponse.json({ error: 'Invalid request body — promptId required' }, { status: 400 })
  }

  // Check user hasn't already submitted
  const existing = await prisma.challengeSubmission.findFirst({
    where: { challengeId, userId },
  })

  if (existing) {
    return NextResponse.json({ error: 'You have already submitted to this challenge' }, { status: 409 })
  }

  // Verify the prompt exists and belongs to user
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { id: true, authorId: true, title: true },
  })

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
  }

  if (prompt.authorId !== userId) {
    return NextResponse.json({ error: 'You can only submit your own prompts' }, { status: 403 })
  }

  // Create the submission
  const submission = await prisma.challengeSubmission.create({
    data: {
      challengeId,
      userId,
      promptId,
    },
    include: {
      user: { select: { username: true, displayName: true } },
      prompt: { select: { id: true, title: true } },
    },
  })

  // Fetch updated challenge with top submissions
  const updatedChallenge = await prisma.dailyChallenge.findUnique({
    where: { id: challengeId },
    include: {
      submissions: {
        orderBy: { votes: 'desc' },
        take: 5,
        include: {
          user: { select: { username: true, displayName: true } },
          prompt: { select: { id: true, title: true } },
        },
      },
    },
  })

  return NextResponse.json({
    submission,
    challenge: updatedChallenge,
    submissionCount: updatedChallenge?.submissions.length ?? 0,
  })
}
