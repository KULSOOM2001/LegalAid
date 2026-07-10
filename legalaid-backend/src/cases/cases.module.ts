import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { CaseStatusLog } from './entities/case-status-log.entity';
import { User } from '../users/entities/user.entity';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, CaseStatusLog, User]),
    forwardRef(() => AiProxyModule),
    NotificationsModule,
  ],
  providers: [CasesService],
  controllers: [CasesController],
  exports: [CasesService, TypeOrmModule],
})
export class CasesModule {}