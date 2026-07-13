import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

@ApiTags('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats/volume')
  volume() {
    return this.adminService.volume();
  }

  @Get('stats/volume-by-domain')
  volumeByDomain() {
    return this.adminService.volumeByDomain();
  }

  @Get('stats/volume-by-volunteer')
  volumeByVolunteer() {
    return this.adminService.volumeByVolunteer();
  }

  @Get('stats/volume-by-month')
  volumeByMonth() {
    return this.adminService.volumeByMonth();
  }

  @Get('stats/resolution-time')
  resolutionTime() {
    return this.adminService.resolutionTime();
  }

  @Get('stats/outcomes')
  outcomes() {
    return this.adminService.outcomes();
  }

  @Get('stats/utilisation')
  utilisation() {
    return this.adminService.utilisation();
  }

  @Get('stats/status-breakdown')
  statusBreakdown() {
    return this.adminService.statusBreakdown();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }
}