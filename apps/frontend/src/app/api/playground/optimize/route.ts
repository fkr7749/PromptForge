import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { content, style } = await req.json() as {
      content: string
      style?: 'precise' | 'few-shot' | 'react' | 'constrained'
    }

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    if (content.length > 10000) {
      return NextResponse.json({ error: 'content exceeds maximum length of 10000 characters' }, { status: 400 })
    }

    const styleInstruction =
      style === 'precise'     ? 'Make this prompt more precise and specific' :
      style === 'few-shot'    ? 'Add few-shot examples to this prompt' :
      style === 'react'       ? 'Convert to ReAct (Reasoning + Acting) format' :
      style === 'constrained' ? 'Add clear constraints and output format' :
      'Optimize for clarity, specificity and effectiveness'

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert prompt engineer. Analyze and improve the following prompt.
Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "optimizedPrompt": "the improved version of the prompt",
  "changes": [{"original": "snippet from original", "improved": "how it was changed", "reason": "why this improves it"}],
  "scores": {
    "original": {"clarity": 7, "specificity": 5, "context": 6, "examples": 3, "outputFormat": 4},
    "optimized": {"clarity": 9, "specificity": 8, "context": 8, "examples": 7, "outputFormat": 8}
  },
  "summary": "2-sentence explanation of the key improvements made"
}`,
        },
        {
          role: 'user',
          content: `${styleInstruction}:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      stream: false,
    })

    const text = response.choices[0]?.message?.content ?? ''

    let result: unknown
    try {
      result = JSON.parse(text)
    } catch {
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        result = JSON.parse(text.slice(start, end + 1))
      } else {
        throw new Error('Failed to extract JSON from response')
      }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Optimization failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
