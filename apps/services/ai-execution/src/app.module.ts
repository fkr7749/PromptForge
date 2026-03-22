import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ExecutionService } from './execution/execution.service'
import { ExecutionController } from './execution/execution.controller'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class AppModule {}
