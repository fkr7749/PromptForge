import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'

// POST: initiate purchase
export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { promptId?: string }
  const { promptId } = body

  if (!promptId) {
    return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { requiresStripe: true, message: 'Payment processing coming soon' },
      { status: 200 }
    )
  }

  // Stripe integration TBD — for now always return coming soon
  return NextResponse.json(
    { requiresStripe: true, message: 'Payment processing coming soon' },
    { status: 200 }
  )
}
