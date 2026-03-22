import { NextRequest, NextResponse } from 'next/server'
import { lintPrompt } from '@/lib/linter'

export async function POST(req: NextRequest) {
  const { content, variables = [] } = await req.json()
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }
  const declaredVarNames = (variables as Array<{ name: string } | string>).map(v =>
    typeof v === 'string' ? v : v.name
  )
  const result = lintPrompt(content, declaredVarNames)
  return NextResponse.json(result)
}
