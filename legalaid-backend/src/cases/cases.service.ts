import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  Case,
  CaseStatus,
  CASE_STATUS_TRANSITIONS,
  CaseOutcome,
} from './entities/case.entity';
import { CaseStatusLog } from './entities/case-status-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCaseDto, UpdateStatusDto, AssignCaseDto, SetOutcomeDto, ManualClassifyDto } from './dto/case.dto';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class CasesService {
constructor(
  @InjectRepository(Case) private casesRepo: Repository<Case>,
  @InjectRepository(CaseStatusLog) private statusLogRepo: Repository<CaseStatusLog>,
  @InjectRepository(User) private usersRepo: Repository<User>,
  @InjectRepository(Appointment)
  private appointmentRepo: Repository<Appointment>,
  private aiProxyService: AiProxyService,
  private notificationsGateway: NotificationsGateway,
) {}

  async create(dto: CreateCaseDto, citizen: { userId: string }) {
    const created = this.casesRepo.create({
      title: dto.title,
      description: dto.description,
      citizenId: citizen.userId,
      status: CaseStatus.SUBMITTED,
    });
    const saved = await this.casesRepo.save(created);
    await this.notificationsGateway.notifyNewCase(saved);
    await this.writeStatusLog(saved.id, null, CaseStatus.SUBMITTED, citizen.userId, 'Case submitted');

    // Fire-and-forget AI classification (Feature 1) — does not block case creation.
    this.aiProxyService
      .classifyCase(saved, citizen.userId)
      .then(async (result) => {
        if (result.success) {
          await this.casesRepo.update(saved.id, {
            domain: result.data.domain,
            urgency: result.data.urgency,
            aiClassificationRationale: result.data.rationale,
            status: CaseStatus.TRIAGED,
          });
          await this.writeStatusLog(saved.id, CaseStatus.SUBMITTED, CaseStatus.TRIAGED, citizen.userId, 'Auto-triaged by AI classifier');

          // Feature 4.1: high-urgency cases trigger an immediate supervisor notification.
          if (result.data.urgency === 'high' || result.data.urgency === 'critical') {
            await this.notificationsGateway.notifyHighUrgencyCase({
              ...saved,
              urgency: result.data.urgency,
            } as Case);
          }
        }
        // On fallback, case stays SUBMITTED; frontend shows manual domain/urgency dropdown (AIClassifierBanner).
      })
      .catch(() => undefined);

    return saved;
  }

  async findForUser(user: { userId: string; role: UserRole }, filters: { domain?: string; status?: string; volunteerId?: string; page?: number; limit?: number }) {
    const qb = this.casesRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.citizen', 'citizen')
      .leftJoinAndSelect('c.volunteer', 'volunteer');

    if (user.role === UserRole.CITIZEN) {
      qb.andWhere('c.citizenId = :uid', { uid: user.userId });
    } else if (user.role === UserRole.VOLUNTEER) {
      qb.andWhere('(c.volunteerId = :uid OR c.volunteerId IS NULL)', { uid: user.userId });
    }

    if (filters.domain) qb.andWhere('c.domain = :domain', { domain: filters.domain });
    if (filters.status) qb.andWhere('c.status = :status', { status: filters.status });
    if (filters.volunteerId) qb.andWhere('c.volunteerId = :vid', { vid: filters.volunteerId });

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    qb.orderBy('c.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOneForUser(id: string, user: { userId: string; role: UserRole }) {
    const found = await this.casesRepo.findOne({
      where: { id },
      relations: ['citizen', 'volunteer', 'statusLogs', 'documents', 'notes', 'statusLogs.changedBy'],
    });
    if (!found) throw new NotFoundException('Case not found');

    const isOwner = found.citizenId === user.userId;
    const isAssigned = found.volunteerId === user.userId;
    const isElevated = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
    if (!isOwner && !isAssigned && !isElevated) {
      throw new ForbiddenException('You do not have access to this case');
    }
    return found;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: { userId: string; role: UserRole }) {
    const found = await this.casesRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Case not found');

    if (user.role === UserRole.VOLUNTEER && found.volunteerId !== user.userId) {
      throw new ForbiddenException('Only the assigned volunteer or a supervisor can change this case status');
    }

    const allowed = CASE_STATUS_TRANSITIONS[found.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition case from '${found.status}' to '${dto.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const fromStatus = found.status;
    found.status = dto.status;
    if (dto.status === CaseStatus.RESOLVED) found.resolvedAt = new Date();
    await this.casesRepo.save(found);
    await this.writeStatusLog(id, fromStatus, dto.status, user.userId, dto.note);

    this.notificationsGateway.notifyCaseStatusChanged(found);
    return found;
  }

  async assign(id: string, dto: AssignCaseDto, user: { userId: string; role: UserRole }) {
    const found = await this.casesRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Case not found');

    // Capacity limit check: don't overload a volunteer with too many active cases.
    const volunteer = await this.usersRepo.findOne({ where: { id: dto.volunteerId } });
    if (!volunteer) throw new NotFoundException('Volunteer not found');

    const activeCount = await this.casesRepo.count({
      where: { volunteerId: dto.volunteerId, status: Not(CaseStatus.CLOSED) },
    });
    if (activeCount >= volunteer.maxActiveCases) {
      throw new BadRequestException(
        `${volunteer.name} already has ${activeCount} active cases (limit: ${volunteer.maxActiveCases}). Reassign to another volunteer or raise their limit.`,
      );
    }

    found.volunteerId = dto.volunteerId;
    if (found.status === CaseStatus.TRIAGED || found.status === CaseStatus.SUBMITTED) {
      found.status = CaseStatus.ASSIGNED;
    }
    await this.casesRepo.save(found);
    await this.writeStatusLog(id, found.status, CaseStatus.ASSIGNED, user.userId, `Assigned to volunteer ${dto.volunteerId}`);

    this.notificationsGateway.notifyCaseAssigned(found);
    return found;
  }

  async setOutcome(id: string, dto: SetOutcomeDto, user: { userId: string; role: UserRole }) {
    const found = await this.casesRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Case not found');
    if (user.role === UserRole.VOLUNTEER && found.volunteerId !== user.userId) {
      throw new ForbiddenException('Only the assigned volunteer or a supervisor can set the outcome');
    }
    found.outcome = dto.outcome;
    await this.casesRepo.save(found);
    return found;
  }

  async manualClassify(id: string, dto: ManualClassifyDto, user: { userId: string; role: UserRole }) {
  const found = await this.casesRepo.findOne({ where: { id } });
  if (!found) throw new NotFoundException('Case not found');

  // Sirf case ka owner citizen, ya supervisor/admin classify kar sake
  const isOwner = found.citizenId === user.userId;
  const isElevated = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  if (!isOwner && !isElevated) {
    throw new ForbiddenException('Only the case owner or a supervisor can classify this case');
  }

  found.domain = dto.domain;
  found.urgency = dto.urgency;
  found.aiClassificationRationale = 'Manually classified (AI unavailable)';
  if (found.status === CaseStatus.SUBMITTED) found.status = CaseStatus.TRIAGED;
  await this.casesRepo.save(found);
  await this.writeStatusLog(id, CaseStatus.SUBMITTED, found.status, user.userId, 'Manually classified by user');

  if (dto.urgency === 'high' || dto.urgency === 'critical') {
    await this.notificationsGateway.notifyHighUrgencyCase(found);
  }

  return found;
}

  private async writeStatusLog(caseId: string, from: CaseStatus | null, to: CaseStatus, changedById: string, note?: string) {
    const log = this.statusLogRepo.create({ caseId, fromStatus: from, toStatus: to, changedById, note });
    return this.statusLogRepo.save(log);
  }

async deleteCase(id: string, user: { userId: string; role: UserRole }) {
  const found = await this.casesRepo.findOne({ where: { id } });

  if (!found) {
    throw new NotFoundException('Case not found');
  }

  if (found.citizenId !== user.userId) {
    throw new ForbiddenException('You can only delete your own case');
  }

  if (
    found.status !== CaseStatus.SUBMITTED &&
    found.status !== CaseStatus.TRIAGED
  ) {
    throw new BadRequestException(
      'Case can only be deleted before a volunteer is assigned.',
    );
  }

  // Delete all appointments linked to this case
  await this.appointmentRepo.delete({
    caseId: found.id,
  });

  // Delete status logs
  await this.statusLogRepo.delete({
    caseId: found.id,
  });

  // Delete the case
  await this.casesRepo.delete(found.id);

  return {
    deleted: true,
    id: found.id,
  };
}

async myStatusBreakdown(citizenId: string) {
  const rows = await this.casesRepo
    .createQueryBuilder('c')
    .select('c.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .where('c.citizenId = :citizenId', { citizenId })
    .groupBy('c.status')
    .getRawMany();
  return rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }));
}

}