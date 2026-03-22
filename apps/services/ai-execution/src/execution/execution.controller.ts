import { Controller, Post, Body, Res, Get } from '@nestjs/common'
import type { Response } from 'express'
import { ExecutionService, type GroqModel } from './execution.service'
import { IsEnum, IsString, IsOptional, IsNumber, IsArray, Min, Max, IsObject } from 'class-validator'

const MODEL_IDS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'moonshotai/kimi-k2-instruct',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
] as const

class ExecuteDto {
  @IsString()
  content: string

  @IsEnum(MODEL_IDS)
  model: GroqModel

  @IsString()
  @IsOptional()
  systemPrompt?: string

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(8192)
  maxTokens?: number
}

class CompareDto {
  @IsString()
  content: string

  @IsArray()
  models: GroqModel[]

  @IsString()
  @IsOptional()
  systemPrompt?: string

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>

  @IsNumber()
  @IsOptional()
  temperature?: number
}

@Controller('execute')
export class ExecutionController {
  constructor(private readonly svc: ExecutionService) {}

  /** SSE streaming endpoint */
  @Post('stream')
  async stream(@Body() dto: ExecuteDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    try {
      for await (const chunk of this.svc.executeStream(dto)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Execution failed'
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    } finally {
      res.end()
    }
  }

  /** Synchronous single execution */
  @Post('sync')
  executeSync(@Body() dto: ExecuteDto) {
    return this.svc.execute(dto)
  }

  /** Compare multiple models simultaneously */
  @Post('compare')
  compare(@Body() dto: CompareDto) {
    return this.svc.compareModels(dto, dto.models)
  }

  /** List available models */
  @Get('models')
  getModels() {
    return { models: this.svc.getAvailableModels() }
  }

  /** Health check */
  @Get('health')
  health() {
    return { status: 'ok', service: 'ai-execution', groqConnected: true }
  }
}
