import { Controller, Get } from '@nestjs/common'
import { PrismaClient } from '@promptforge/database'

const prisma = new PrismaClient()

@Controller('health')
export class HealthController {
  @Get('live')
  liveness() {
    return { status: 'ok', service: 'analytics', timestamp: new Date().toISOString() }
  }

  @Get('ready')
  async readiness() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ready', db: 'ok', timestamp: new Date().toISOString() }
    } catch (error) {
      return { status: 'not-ready', db: 'error', timestamp: new Date().toISOString() }
    }
  }

  @Get('startup')
  async startup() {
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM _prisma_migrations WHERE applied_steps_count > 0`
      return { status: 'started', migrations: 'ok', timestamp: new Date().toISOString() }
    } catch (error) {
      return { status: 'started', migrations: 'unknown', timestamp: new Date().toISOString() }
    }
  }
}
