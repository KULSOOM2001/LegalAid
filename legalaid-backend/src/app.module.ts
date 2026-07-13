import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { DocumentsModule } from './documents/documents.module';
import { NotesModule } from './notes/notes.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiProxyModule } from './ai-proxy/ai-proxy.module';
import { AdminModule } from './admin/admin.module';

import { User } from './users/entities/user.entity';
import { Case } from './cases/entities/case.entity';
import { CaseStatusLog } from './cases/entities/case-status-log.entity';
import { Document } from './documents/entities/document.entity';
import { DocumentAccessLog } from './documents/entities/document-access-log.entity';
import { CaseNote } from './notes/entities/case-note.entity';
import { Availability } from './appointments/entities/availability.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Notification } from './notifications/notification.entity';
import { AiInteraction } from './ai-proxy/entities/ai-interaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required by Neon
      entities: [
        User,
        Case,
        CaseStatusLog,
        Document,
        DocumentAccessLog,
        CaseNote,
        Availability,
        Appointment,
        Notification,
        AiInteraction,
      ],
      // synchronize:true is fine for a course project / Neon dev branch.
      // Switch to migrations (see migrations/ folder) before any real deployment.
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    CasesModule,
    DocumentsModule,
    NotesModule,
    AppointmentsModule,
    NotificationsModule,
    AiProxyModule,
    AdminModule,
  ],
})
export class AppModule {}