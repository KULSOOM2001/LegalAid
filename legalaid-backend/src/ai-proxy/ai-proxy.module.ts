import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiInteraction } from './entities/ai-interaction.entity';
import { Case } from '../cases/entities/case.entity';
import { CaseNote } from '../notes/entities/case-note.entity';
import { AiProxyService } from './ai-proxy.service';
import { AiProxyController } from './ai-proxy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiInteraction, Case, CaseNote])],
  providers: [AiProxyService],
  controllers: [AiProxyController],
  exports: [AiProxyService],
})
export class AiProxyModule {}
