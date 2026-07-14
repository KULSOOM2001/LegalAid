import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, CreateAvailabilityDto } from './dto/appointment.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
    @InjectRepository(Availability) private availRepo: Repository<Availability>,
    private notificationsGateway: NotificationsGateway, 
  ) {}

  async setAvailability(volunteerId: string, dto: CreateAvailabilityDto) {
    const slot = this.availRepo.create({ volunteerId, ...dto });
    return this.availRepo.save(slot);
  }

  async getAvailability(volunteerId: string) {
    return this.availRepo.find({ where: { volunteerId }, order: { dayOfWeek: 'ASC', startTime: 'ASC' } });
  }

  async deleteAvailability(id: string, volunteerId: string) {
    const slot = await this.availRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (slot.volunteerId !== volunteerId) {
      throw new ForbiddenException('You can only delete your own availability slots');
    }
    await this.availRepo.remove(slot);
    return { success: true };
  }

  async book(dto: CreateAppointmentDto, citizenId: string) {
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    if (end <= start) throw new BadRequestException('endsAt must be after startsAt');

    // 1. Check volunteer has a recurring availability slot covering this time.
    const dayOfWeek = start.getDay();
    const startHHMM = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const endHHMM = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    const slots = await this.availRepo.find({ where: { volunteerId: dto.volunteerId, dayOfWeek } });
    const covered = slots.some((s) => s.startTime <= startHHMM && s.endTime >= endHHMM);
    if (!covered) {
      throw new BadRequestException('Volunteer is not available at the requested time');
    }

    const conflict = await this.apptRepo.findOne({
      where: {
        volunteerId: dto.volunteerId,
        status: Not(AppointmentStatus.CANCELLED),
        startsAt: LessThan(end),
        endsAt: MoreThan(start),
      },
    });
    if (conflict) throw new BadRequestException('Volunteer already has a booking that overlaps this time slot');

    const appt = this.apptRepo.create({
      caseId: dto.caseId,
      citizenId,
      volunteerId: dto.volunteerId,
      startsAt: start,
      endsAt: end,
      status: AppointmentStatus.REQUESTED,
    });
   const saved = await this.apptRepo.save(appt);
   await this.notificationsGateway.notifyAppointmentRequested(saved);
   return saved;
  }

  async findForUser(user: { userId: string; role: UserRole }) {
  const relations = ['citizen', 'volunteer', 'case'];
  if (user.role === UserRole.CITIZEN) {
    return this.apptRepo.find({ where: { citizenId: user.userId }, relations, order: { startsAt: 'ASC' } });
  }
  if (user.role === UserRole.VOLUNTEER) {
    return this.apptRepo.find({ where: { volunteerId: user.userId }, relations, order: { startsAt: 'ASC' } });
  }
  return this.apptRepo.find({ relations, order: { startsAt: 'ASC' } });
}

  async update(id: string, dto: UpdateAppointmentDto, user: { userId: string; role: UserRole }) {
    const appt = await this.apptRepo.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (user.role === UserRole.VOLUNTEER && appt.volunteerId !== user.userId) {
      throw new ForbiddenException('Only the assigned volunteer can update this appointment');
    }

    if (dto.action === 'confirm') appt.status = AppointmentStatus.CONFIRMED;
    else if (dto.action === 'cancel') appt.status = AppointmentStatus.CANCELLED;
    else if (dto.action === 'reschedule') {
      if (!dto.startsAt || !dto.endsAt) throw new BadRequestException('startsAt and endsAt required to reschedule');
      appt.startsAt = new Date(dto.startsAt);
      appt.endsAt = new Date(dto.endsAt);
      appt.status = AppointmentStatus.RESCHEDULED;
    }
    const saved = await this.apptRepo.save(appt);
    await this.notificationsGateway.notifyAppointmentStatusChanged(saved);
    return saved;
  }
}
