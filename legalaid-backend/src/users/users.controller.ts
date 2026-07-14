import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('volunteers')
  getVolunteers() {
    return this.usersService.findVolunteers();
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Roles(UserRole.ADMIN)
  @Post('invite')
  invite(@Body() body: { name: string; email: string; password: string; role: UserRole; supervisorId?: string }) {
    return this.usersService.createInvited(body);
  }

@Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; email?: string; role?: UserRole }, @CurrentUser() user: any) {
    if (id === user.userId && body.role && body.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot change your own role away from admin');
    }
    return this.usersService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean, @CurrentUser() user: any) {
    if (id === user.userId && isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.usersService.setActive(id, isActive);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @Patch(':id/capacity')
  setCapacity(@Param('id') id: string, @Body('maxActiveCases') maxActiveCases: number) {
    return this.usersService.setCapacity(id, maxActiveCases);
  }
}