import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case, CaseStatus } from '../cases/entities/case.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Case) private casesRepo: Repository<Case>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async volume() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select("to_char(c.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where("c.createdAt > NOW() - INTERVAL '30 days'")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
    return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));
  }

  async volumeByDomain() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select('c.domain', 'domain')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.domain')
      .getRawMany();
    return rows.map((r) => ({ domain: r.domain || 'unclassified', count: parseInt(r.count, 10) }));
  }

  async volumeByVolunteer() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .leftJoin('c.volunteer', 'v')
      .select('v.id', 'volunteerId')
      .addSelect('v.name', 'volunteerName')
      .addSelect('COUNT(*)', 'count')
      .where('c.volunteerId IS NOT NULL')
      .groupBy('v.id')
      .addGroupBy('v.name')
      .getRawMany();
    return rows.map((r) => ({ volunteerId: r.volunteerId, volunteerName: r.volunteerName, count: parseInt(r.count, 10) }));
  }

  async volumeByMonth() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select("to_char(c.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
    return rows.map((r) => ({ month: r.month, count: parseInt(r.count, 10) }));
  }

  async resolutionTime() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select('c.domain', 'domain')
      .addSelect('AVG(EXTRACT(EPOCH FROM (c.resolvedAt - c.createdAt)) / 3600)', 'avgHours')
      .where('c.resolvedAt IS NOT NULL')
      .groupBy('c.domain')
      .getRawMany();
    return rows.map((r) => ({ domain: r.domain, avgHours: r.avgHours ? parseFloat(r.avgHours).toFixed(1) : null }));
  }

  async outcomes() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select('c.outcome', 'outcome')
      .addSelect('COUNT(*)', 'count')
      .where('c.outcome IS NOT NULL')
      .groupBy('c.outcome')
      .getRawMany();
    return rows.map((r) => ({ outcome: r.outcome, count: parseInt(r.count, 10) }));
  }

  async utilisation() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .leftJoin('c.volunteer', 'v')
      .select('v.id', 'volunteerId')
      .addSelect('v.name', 'volunteerName')
      .addSelect('COUNT(*)', 'activeCases')
      .where('c.volunteerId IS NOT NULL')
      .andWhere('c.status != :closed', { closed: CaseStatus.CLOSED })
      .groupBy('v.id')
      .addGroupBy('v.name')
      .getRawMany();
    return rows.map((r) => ({ volunteerId: r.volunteerId, volunteerName: r.volunteerName, activeCases: parseInt(r.activeCases, 10) }));
  }

  async listUsers() {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async statusBreakdown() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();
    return rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }));
  }

  // --- Edit user ---
  async updateUser(
    id: string,
    dto: { name?: string; email?: string; role?: UserRole; maxActiveCases?: number },
  ) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Another user already has this email');
    }

    Object.assign(user, {
      name: dto.name ?? user.name,
      email: dto.email ?? user.email,
      role: dto.role ?? user.role,
      maxActiveCases: dto.maxActiveCases ?? user.maxActiveCases,
    });

    await this.usersRepo.save(user);
    return user;
  }

  // --- Delete user (permanent) ---
  async deleteUser(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const asCitizen = await this.casesRepo.count({ where: { citizenId: id } });
    const asVolunteer = await this.casesRepo.count({ where: { volunteerId: id } });

    if (asCitizen > 0 || asVolunteer > 0) {
      throw new BadRequestException(
        `Cannot delete ${user.name}: they are linked to ${asCitizen + asVolunteer} case(s) as citizen/volunteer. Reassign or close those cases first.`,
      );
    }

    await this.usersRepo.remove(user);
    return { success: true };
  }
}