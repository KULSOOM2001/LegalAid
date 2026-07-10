import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Document } from './entities/document.entity';
import { DocumentAccessLog } from './entities/document-access-log.entity';
import { Case } from '../cases/entities/case.entity';
import { UserRole } from '../users/entities/user.entity';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private docsRepo: Repository<Document>,
    @InjectRepository(DocumentAccessLog) private accessLogRepo: Repository<DocumentAccessLog>,
    @InjectRepository(Case) private casesRepo: Repository<Case>,
    private aiProxyService: AiProxyService,
    private notificationsGateway: NotificationsGateway,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async upload(caseId: string, file: Express.Multer.File, user: { userId: string; role: UserRole }) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_SIZE) throw new BadRequestException('File exceeds 10MB limit');
    if (!ALLOWED_MIME.includes(file.mimetype)) throw new BadRequestException('Only PDF or image files are allowed');

    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    if (user.role === UserRole.CITIZEN && found.citizenId !== user.userId) {
      throw new ForbiddenException('You can only upload documents to your own case');
    }

    const doc = this.docsRepo.create({
      caseId,
      uploadedById: user.userId,
      originalName: file.originalname,
      storagePath: file.path,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      summaryPending: true,
    });
    const saved = await this.docsRepo.save(doc);

    this.notificationsGateway.notifyDocumentUploaded({ ...saved, case: found } as any, found.title);

    this.summariseAsync(saved, found, user.userId).catch(() => undefined);

    return saved;
  }

  private async summariseAsync(doc: Document, c: Case, requestedById: string) {
    const documentText = `Filename: ${doc.originalName}\nType: ${doc.mimeType}\n(Full OCR/text extraction not wired up in this build — summarising based on available metadata.)`;

    const result = await this.aiProxyService.summariseDocument({
      caseId: c.id,
      caseTitle: c.title,
      documentText,
      requestedById,
    });

    if (result.success) {
      await this.docsRepo.update(doc.id, {
        aiSummary: result.data.summary,
        aiUrgentFlag: !!result.data.urgent,
        summaryPending: false,
      });
    } else {
      await this.docsRepo.update(doc.id, {
        aiSummary: 'Document received. AI summary unavailable — please review the raw file manually.',
        summaryPending: false,
      });
    }
  }

  async findForCase(caseId: string, user: { userId: string; role: UserRole }) {
    const c = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!c) throw new NotFoundException('Case not found');
    const allowed =
      user.role === UserRole.SUPERVISOR ||
      user.role === UserRole.ADMIN ||
      c.citizenId === user.userId ||
      c.volunteerId === user.userId;
    if (!allowed) throw new ForbiddenException('You do not have access to this case');
    return this.docsRepo.find({ where: { caseId }, order: { createdAt: 'DESC' } });
  }

  async getForDownload(id: string, user: { userId: string; role: UserRole }) {
    const doc = await this.docsRepo.findOne({ where: { id }, relations: ['case'] });
    if (!doc) throw new NotFoundException('Document not found');
    const c = doc.case;
    const allowed =
      user.role === UserRole.SUPERVISOR ||
      user.role === UserRole.ADMIN ||
      c.citizenId === user.userId ||
      c.volunteerId === user.userId;
    if (!allowed) throw new ForbiddenException('You do not have access to this document');

    const log = this.accessLogRepo.create({
      documentId: doc.id,
      accessedById: user.userId,
      action: 'download',
    });
    await this.accessLogRepo.save(log);

    return doc;
  }

  async getAccessLogs(documentId: string) {
    return this.accessLogRepo.find({
      where: { documentId },
      relations: ['accessedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}