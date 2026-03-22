import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const session = await prisma.battleSession.findUnique({
            where: { id },
            select: {
              id: true,
              votesA: true,
              votesB: true,
              status: true,
              expiresAt: true,
              winnerId: true,
            },
          })

          if (!session) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Session not found' })}\n\n`))
            clearInterval(intervalId)
            controller.close()
            return
          }

          const totalVotes = session.votesA + session.votesB
          const percentA = totalVotes > 0 ? Math.round((session.votesA / totalVotes) * 100) : 50
          const percentB = totalVotes > 0 ? Math.round((session.votesB / totalVotes) * 100) : 50
          const timeRemaining = Math.max(0, new Date(session.expiresAt).getTime() - Date.now())

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            votesA: session.votesA,
            votesB: session.votesB,
            percentA,
            percentB,
            totalVotes,
            timeRemaining,
            status: session.status,
            winnerId: session.winnerId,
          })}\n\n`))

          // Stop polling if battle is over
          if (session.status === 'completed' || timeRemaining === 0) {
            clearInterval(intervalId)
            controller.close()
          }
        } catch {
          clearInterval(intervalId)
          controller.close()
        }
      }

      // Send immediately, then every 3 seconds
      await send()
      intervalId = setInterval(send, 3000)

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
