import { Injectable } from '@nestjs/common';
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
    // cases created per day for the last 30 days (kept for the existing area chart)
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

  // Spec 3.6: case volume by legal domain
  async volumeByDomain() {
    const rows = await this.casesRepo
      .createQueryBuilder('c')
      .select('c.domain', 'domain')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.domain')
      .getRawMany();
    return rows.map((r) => ({ domain: r.domain || 'unclassified', count: parseInt(r.count, 10) }));
  }

  // Spec 3.6: case volume by volunteer
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

  // Spec 3.6: case volume by month
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
}