import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class AppointmentsReminderScheduler {
  private readonly logger = new Logger(AppointmentsReminderScheduler.name);
  private readonly WINDOW_MINUTES = 5; // matches the cron interval below

  constructor(
    @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReminders() {
    await this.fire24h();
    await this.fire1h();
  }

  private async fire24h() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60000 - this.WINDOW_MINUTES * 60000);
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60000 + this.WINDOW_MINUTES * 60000);

    const due = await this.apptRepo.find({
      where: {
        startsAt: Between(windowStart, windowEnd),
        reminder24hSent: false,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    for (const appt of due) {
      await this.notificationsGateway.notifyAppointmentReminder(appt, 24);
      await this.apptRepo.update(appt.id, { reminder24hSent: true });
    }
    if (due.length) this.logger.log(`Fired ${due.length} 24h reminder(s)`);
  }

  private async fire1h() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60000 - this.WINDOW_MINUTES * 60000);
    const windowEnd = new Date(now.getTime() + 60 * 60000 + this.WINDOW_MINUTES * 60000);

    const due = await this.apptRepo.find({
      where: {
        startsAt: Between(windowStart, windowEnd),
        reminder1hSent: false,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    for (const appt of due) {
      await this.notificationsGateway.notifyAppointmentReminder(appt, 1);
      await this.apptRepo.update(appt.id, { reminder1hSent: true });
    }
    if (due.length) this.logger.log(`Fired ${due.length} 1h reminder(s)`);
  }
}