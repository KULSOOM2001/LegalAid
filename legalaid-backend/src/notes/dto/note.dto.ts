import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  content: string;

  // If true, `content` is treated as a rough instruction and Feature 3
  // (AI letter drafting) is triggered; the AI output becomes the note content
  // (isAiDraft=true) awaiting volunteer approval via PATCH /notes/:id/approve.
  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}

export class ApproveNoteDto {
  @IsString()
  content: string; // volunteer's final edited text
}
