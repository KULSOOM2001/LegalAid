import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Roles(
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
  UserRole.VOLUNTEER,
  UserRole.CITIZEN
  )
  @Post('cases/:caseId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(@Param('caseId') caseId: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.documentsService.upload(caseId, file, user);
  }

  @Get('cases/:caseId/documents')
  findForCase(@Param('caseId') caseId: string, @CurrentUser() user: any) {
    return this.documentsService.findForCase(caseId, user);
  }

  @Get('documents/:id/download')
  async download(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const doc = await this.documentsService.getForDownload(id, user);
    return res.download(doc.storagePath, doc.originalName);
  }

  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @Get('documents/:id/access-logs')
  getAccessLogs(@Param('id') id: string) {
    return this.documentsService.getAccessLogs(id);
  }
}