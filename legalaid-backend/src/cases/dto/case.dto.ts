import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CaseStatus, CaseOutcome, CaseDomain, CaseUrgency } from '../entities/case.entity';

export class CreateCaseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class UpdateStatusDto {
  @IsEnum(CaseStatus)
  status: CaseStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
export class ManualClassifyDto {
  @IsEnum(CaseDomain)
  domain: CaseDomain;

  @IsEnum(CaseUrgency)
  urgency: CaseUrgency;
}

export class AssignCaseDto {
  @IsUUID()
  volunteerId: string;
}

export class SetOutcomeDto {
  @IsEnum(CaseOutcome)
  outcome: CaseOutcome;
}
