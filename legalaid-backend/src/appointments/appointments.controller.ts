import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, CreateAvailabilityDto } from './dto/appointment.dto';

@ApiTags('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Roles(UserRole.CITIZEN)
  @Post('appointments')
  book(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.book(dto, user.userId);
  }

  @Get('appointments')
  findForUser(@CurrentUser() user: any) {
    return this.appointmentsService.findForUser(user);
  }

  @Roles(UserRole.VOLUNTEER)
  @Patch('appointments/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.update(id, dto, user);
  }

  @Roles(UserRole.VOLUNTEER)
  @Post('availability')
  setAvailability(@Body() dto: CreateAvailabilityDto, @CurrentUser() user: any) {
    return this.appointmentsService.setAvailability(user.userId, dto);
  }

  @Get('availability/:volunteerId')
  getAvailability(@Param('volunteerId') volunteerId: string) {
    return this.appointmentsService.getAvailability(volunteerId);
  }

  @Roles(UserRole.VOLUNTEER)
  @Delete('availability/:id')
  deleteAvailability(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.deleteAvailability(id, user.userId);
  }
}
