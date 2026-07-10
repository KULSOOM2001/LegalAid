import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  findAll(role?: UserRole) {
    return this.usersRepo.find({
      where: role ? { role } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findVolunteers() {
    return this.usersRepo.find({ where: { role: UserRole.VOLUNTEER, isActive: true } });
  }

  // Admin invites/seeds non-citizen roles (volunteer/supervisor/admin)
  async createInvited(data: { name: string; email: string; password: string; role: UserRole; supervisorId?: string }) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({ ...data, password: hashed });
    return this.usersRepo.save(user);
  }

  async setActive(id: string, isActive: boolean) {
    await this.usersRepo.update(id, { isActive });
    return this.findOne(id);
  }
}
