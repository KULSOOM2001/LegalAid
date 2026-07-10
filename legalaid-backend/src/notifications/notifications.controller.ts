import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Notification } from './notification.entity';

@ApiTags('notifications')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.repo.find({ where: { userId: user.userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    await this.repo.update(id, { read: true });
    return { success: true };
  }
}
