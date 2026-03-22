import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { AIModel, Prisma } from '@promptforge/database'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Map Groq model IDs → AIModel enum values
// AIModel enum: GPT4O | GPT4 | CLAUDE_3_5_SONNET | CLAUDE_3_OPUS | GEMINI_1_5_PRO | MISTRAL_LARGE
const MODEL_MAP: Record<string, AIModel> = {
  'llama-3.3-70b-versatile': AIModel.GPT4O,
  'llama-3.1-70b-versatile': AIModel.GPT4,
  'mixtral-8x7b-32768': AIModel.MISTRAL_LARGE,
  'gemma2-9b-it': AIModel.GEMINI_1_5_PRO,
  'llama3-70b-8192': AIModel.CLAUDE_3_5_SONNET,
  'llama3-8b-8192': AIModel.CLAUDE_3_OPUS,
}

function resolveModel(raw: string): AIModel {
  // Direct map from Groq IDs
  if (raw in MODEL_MAP) return MODEL_MAP[raw]!
  // Accept raw enum strings like 'CLAUDE_3_5_SONNET'
  if (Object.values(AIModel).includes(raw as AIModel)) {
    return raw as AIModel
  }
  return AIModel.GPT4O
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const limitRaw = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
    const limit = Math.min(isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, MAX_LIMIT)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const promptId = searchParams.get('promptId')

    const where: Prisma.PromptExecutionWhereInput = { userId }
    if (promptId) {
      where.promptId = promptId
    }

    const skip = (page - 1) * limit

    const [executions, total] = await Promise.all([
      prisma.promptExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          latencyMs: true,
          cost: true,
          success: true,
          createdAt: true,
          prompt: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.promptExecution.count({ where }),
    ])

    return NextResponse.json({
      executions,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/executions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth optional — userId null if no token
    const userId = getUserIdFromRequest(request)

    let body: {
      promptId?: string | null
      model?: string
      inputContent?: string
      outputContent?: string
      variables?: Record<string, unknown>
      inputTokens?: number
      outputTokens?: number
      latencyMs?: number
      cost?: number
      success?: boolean
      errorMessage?: string | null
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      promptId,
      model,
      inputContent,
      outputContent,
      variables,
      inputTokens,
      outputTokens,
      latencyMs,
      cost,
      success,
      errorMessage,
    } = body

    if (!inputContent || typeof inputContent !== 'string') {
      return NextResponse.json({ error: 'inputContent is required' }, { status: 400 })
    }
    if (!outputContent || typeof outputContent !== 'string') {
      return NextResponse.json({ error: 'outputContent is required' }, { status: 400 })
    }

    const resolvedModel = resolveModel(model ?? '')

    const execution = await prisma.promptExecution.create({
      data: {
        promptId: promptId ?? null,
        userId: userId ?? null,
        model: resolvedModel,
        inputContent,
        outputContent,
        variables: variables != null ? (variables as Prisma.InputJsonValue) : Prisma.JsonNull,
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        latencyMs: latencyMs ?? 0,
        cost: cost ?? 0,
        success: typeof success === 'boolean' ? success : true,
        errorMessage: errorMessage ?? null,
      },
    })

    return NextResponse.json(execution, { status: 201 })
  } catch (error) {
    console.error('POST /api/executions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
