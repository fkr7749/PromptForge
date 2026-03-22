import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      content: string
      targetLanguage: string
    }

    const { content, targetLanguage } = body

    if (!content || !targetLanguage) {
      return NextResponse.json({ error: 'content and targetLanguage are required' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    // Run translation and detection in parallel
    const [translateRes, detectRes] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the text to ${targetLanguage}. IMPORTANT: Keep all text in double curly braces like {{variable_name}} UNCHANGED - do not translate them. Return ONLY the translated text.`,
          },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Identify the language of this text. Return ONLY the language name in English (e.g., 'English', 'Spanish', 'French'). Text: "${content.slice(0, 300)}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 20,
        stream: false,
      }),
    ])

    const translatedContent = translateRes.choices[0]?.message?.content ?? ''
    const detectedLanguage = detectRes.choices[0]?.message?.content?.trim() ?? 'Unknown'

    return NextResponse.json({ translatedContent, detectedLanguage })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
