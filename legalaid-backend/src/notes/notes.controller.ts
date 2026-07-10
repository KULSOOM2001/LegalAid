import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotesService } from './notes.service';
import { CreateNoteDto, ApproveNoteDto } from './dto/note.dto';

@ApiTags('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Roles(UserRole.VOLUNTEER)
  @Post('cases/:caseId/notes')
  create(@Param('caseId') caseId: string, @Body() dto: CreateNoteDto, @CurrentUser() user: any) {
    return this.notesService.create(caseId, dto, user);
  }

  @Roles(UserRole.VOLUNTEER, UserRole.SUPERVISOR)
  @Get('cases/:caseId/notes')
  findForCase(@Param('caseId') caseId: string) {
    return this.notesService.findForCase(caseId);
  }

  @Roles(UserRole.VOLUNTEER)
  @Patch('notes/:id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveNoteDto, @CurrentUser() user: any) {
    return this.notesService.approve(id, dto, user);
  }
}
