import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AiProxyService } from './ai-proxy.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../cases/entities/case.entity';
import { CaseNote } from '../notes/entities/case-note.entity';

class PredictOutcomeDto {
  @IsUUID()
  caseId: string;
}
@ApiTags('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiProxyController {
  constructor(
    private aiProxyService: AiProxyService,
    @InjectRepository(Case) private casesRepo: Repository<Case>,
    @InjectRepository(CaseNote) private notesRepo: Repository<CaseNote>,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.SUPERVISOR)
  @Post('predict-outcome')
  async predictOutcome(@Body() dto: PredictOutcomeDto, @CurrentUser() user: any) {
    const c = await this.casesRepo.findOne({ where: { id: dto.caseId } });
    if (!c) return { success: false, fallback: true, error: 'Case not found' };

    const notes = await this.notesRepo.find({ where: { caseId: c.id }, take: 5, order: { createdAt: 'DESC' } });
    return this.aiProxyService.predictOutcome({
      caseId: c.id,
      title: c.title,
      description: c.description,
      domain: c.domain,
      urgency: c.urgency,
      noteSummaries: notes.map((n) => n.content.slice(0, 200)),
      requestedById: user.userId,
    });
  }
}
