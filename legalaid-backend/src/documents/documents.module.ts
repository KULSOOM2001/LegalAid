import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentAccessLog } from './entities/document-access-log.entity';
import { Case } from '../cases/entities/case.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentAccessLog, Case]), AiProxyModule, NotificationsModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}