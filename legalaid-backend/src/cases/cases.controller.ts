import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CasesService } from './cases.service';
import { CreateCaseDto, UpdateStatusDto, AssignCaseDto, SetOutcomeDto } from './dto/case.dto';

@ApiTags('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Roles(UserRole.CITIZEN)
  @Post()
  create(@Body() dto: CreateCaseDto, @CurrentUser() user: any) {
    return this.casesService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('domain') domain?: string,
    @Query('status') status?: string,
    @Query('volunteerId') volunteerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findForUser(user, {
      domain,
      status,
      volunteerId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.casesService.findOneForUser(id, user);
  }

  @Roles(UserRole.VOLUNTEER, UserRole.SUPERVISOR)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.casesService.updateStatus(id, dto, user);
  }

  @Roles(UserRole.SUPERVISOR)
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignCaseDto, @CurrentUser() user: any) {
    return this.casesService.assign(id, dto, user);
  }

  @Roles(UserRole.VOLUNTEER, UserRole.SUPERVISOR)
  @Patch(':id/outcome')
  setOutcome(@Param('id') id: string, @Body() dto: SetOutcomeDto, @CurrentUser() user: any) {
    return this.casesService.setOutcome(id, dto, user);
  }
}
