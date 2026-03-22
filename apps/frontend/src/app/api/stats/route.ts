import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // revalidate every hour

export async function GET() {
  try {
    const [promptCount, userCount, executionCount, tagCount] = await Promise.all([
      prisma.prompt.count({ where: { isPublic: true } }),
      prisma.user.count(),
      prisma.promptExecution.count(),
      prisma.tag.count(),
    ])

    return NextResponse.json({
      prompts: promptCount,
      builders: userCount,
      executions: executionCount,
      tags: tagCount,
    })
  } catch (err) {
    console.error('Stats fetch error:', err)
    return NextResponse.json(
      { prompts: 0, builders: 0, executions: 0, tags: 0 },
      { status: 500 }
    )
  }
}
