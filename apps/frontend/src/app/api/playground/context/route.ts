import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { text?: string }

    const MAX_CHARS = 8000
    const text = (body.text ?? '').slice(0, MAX_CHARS)
    // Simple chunking: split by paragraphs
    const chunks = text.split(/\n\n+/).filter(c => c.trim().length > 0)

    return NextResponse.json({
      context: text,
      charCount: text.length,
      chunkCount: chunks.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Context processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
