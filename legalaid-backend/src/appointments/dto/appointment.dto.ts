import { IsDateString, IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  caseId: string;

  @IsUUID()
  volunteerId: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}

export class UpdateAppointmentDto {
  @IsString()
  action: 'confirm' | 'reschedule' | 'cancel';

  @IsDateString()
  startsAt?: string;

  @IsDateString()
  endsAt?: string;
}

export class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string; // 'HH:mm'

  @IsString()
  endTime: string;
}
