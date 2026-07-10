import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsReminderScheduler } from './appointments-reminder.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Availability]), NotificationsModule],
  providers: [AppointmentsService, AppointmentsReminderScheduler],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}