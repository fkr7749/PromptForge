import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json() as { content: string }

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a content safety analyzer specializing in AI prompt safety.',
        },
        {
          role: 'user',
          content: `Analyze this prompt and return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "overallScore": 85,
  "flags": [{"type": "pii|jailbreak|toxicity|injection", "severity": "low|medium|high", "detail": "specific issue found"}],
  "piiDetected": false,
  "jailbreakRisk": "none|low|medium|high",
  "toxicityScore": 5,
  "recommendation": "safe|review|block",
  "summary": "Brief safety assessment"
}

Prompt to analyze:
${content}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
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
    const message = err instanceof Error ? err.message : 'Safety check failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
