import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  content: string;
  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}

export class ApproveNoteDto {
  @IsString()
  content: string;
}
