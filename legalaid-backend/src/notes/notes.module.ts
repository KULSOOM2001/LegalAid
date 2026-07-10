import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseNote } from './entities/case-note.entity';
import { Case } from '../cases/entities/case.entity';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaseNote, Case]), AiProxyModule],
  providers: [NotesService],
  controllers: [NotesController],
})
export class NotesModule {}
