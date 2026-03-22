import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

// List of challenge themes to cycle through
const CHALLENGE_THEMES = [
  { theme: "Best Code Review Prompt", description: "Write the most effective prompt for reviewing code and catching bugs", category: "CODING" },
  { theme: "Ultimate Blog Writer", description: "Create a prompt that generates engaging, SEO-optimized blog posts", category: "WRITING" },
  { theme: "Data Analyst Pro", description: "Build a prompt that extracts key insights from complex datasets", category: "ANALYSIS" },
  { theme: "Customer Support Hero", description: "Design a prompt for handling difficult customer support scenarios", category: "BUSINESS" },
  { theme: "Creative Storyteller", description: "Craft the most imaginative prompt for generating compelling stories", category: "CREATIVITY" },
  { theme: "Research Synthesizer", description: "Create a prompt that summarizes and connects multiple research papers", category: "RESEARCH" },
  { theme: "Master Teacher", description: "Design a prompt that explains complex topics to beginners", category: "EDUCATION" },
]

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let challenge = await prisma.dailyChallenge.findFirst({
    where: { date: today },
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

  if (!challenge) {
    // Create today's challenge
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % CHALLENGE_THEMES.length
    const theme = CHALLENGE_THEMES[dayIndex]!
    challenge = await prisma.dailyChallenge.create({
      data: {
        date: today,
        theme: theme.theme,
        description: theme.description,
        category: theme.category,
        status: 'active',
      },
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
  }

  // Check if current user has submitted
  let userSubmission = null
  if (userId) {
    userSubmission = await prisma.challengeSubmission.findFirst({
      where: { challengeId: challenge.id, userId },
    })
  }

  // Calculate time remaining until midnight UTC
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const timeRemaining = tomorrow.getTime() - Date.now()

  return NextResponse.json({
    challenge,
    userSubmission,
    timeRemaining,
    submissionCount: challenge.submissions.length,
  })
}
