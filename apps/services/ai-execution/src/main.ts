import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors({ origin: true, credentials: true })
  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT ?? 4003)
  console.log(`AI Execution service running on port ${process.env.PORT ?? 4003}`)
}

bootstrap()
