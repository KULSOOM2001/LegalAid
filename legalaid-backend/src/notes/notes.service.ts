import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseNote } from './entities/case-note.entity';
import { Case } from '../cases/entities/case.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreateNoteDto, ApproveNoteDto } from './dto/note.dto';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(CaseNote) private notesRepo: Repository<CaseNote>,
    @InjectRepository(Case) private casesRepo: Repository<Case>,
    private aiProxyService: AiProxyService,
  ) {}

  async create(caseId: string, dto: CreateNoteDto, user: { userId: string; role: UserRole }) {
    const c = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!c) throw new NotFoundException('Case not found');
    if (user.role === UserRole.VOLUNTEER && c.volunteerId !== user.userId) {
      throw new ForbiddenException('Only the assigned volunteer can add notes to this case');
    }

    if (dto.draft) {
      const result = await this.aiProxyService.draftLetter({
        caseId,
        caseTitle: c.title,
        domain: c.domain,
        roughNote: dto.content,
        requestedById: user.userId,
      });

      const content = result.success
        ? result.data
        : `[AI drafting unavailable — write the letter manually]\n\nRough note: ${dto.content}`;

      const note = this.notesRepo.create({
        caseId,
        authorId: user.userId,
        content,
        isAiDraft: true,
        approved: false,
      });
      return this.notesRepo.save(note);
    }

    const note = this.notesRepo.create({
      caseId,
      authorId: user.userId,
      content: dto.content,
      isAiDraft: false,
      approved: true,
    });
    return this.notesRepo.save(note);
  }

  async findForCase(caseId: string) {
    return this.notesRepo.find({ where: { caseId }, order: { createdAt: 'DESC' }, relations: ['author'] });
  }

  async approve(id: string, dto: ApproveNoteDto, user: { userId: string; role: UserRole }) {
    const note = await this.notesRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.authorId !== user.userId && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('Only the authoring volunteer can approve this draft');
    }
    note.content = dto.content;
    note.approved = true;
    note.approvedAt = new Date();
    return this.notesRepo.save(note);
  }
}
