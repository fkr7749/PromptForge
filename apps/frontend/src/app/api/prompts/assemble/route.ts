import { NextRequest, NextResponse } from 'next/server'

interface Block {
  type: string
  content: string
}

const BLOCK_HEADERS: Record<string, string> = {
  SYSTEM: '## System Instruction',
  CONTEXT: '## Context',
  INSTRUCTION: '## Task',
  EXAMPLE: '## Example',
  OUTPUT_FORMAT: '## Output Format',
  VARIABLE: '', // inline, no header
}

// POST: assemble blocks into prompt text
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { blocks?: Block[] }
    const blocks = body.blocks

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
    }

    const lines = blocks.map((b: Block) => {
      const header = BLOCK_HEADERS[b.type]
      return header ? `${header}\n${b.content}` : b.content
    })

    const assembledPrompt = lines.join('\n\n')

    return NextResponse.json({ assembledPrompt })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
