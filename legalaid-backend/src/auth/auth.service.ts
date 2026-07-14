import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private async signTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: UserRole.CITIZEN,
    });
    const saved = await this.usersRepo.save(user);
    const tokens = await this.signTokens(saved);
    return { ...tokens, user: this.sanitize(saved) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'email', 'password', 'role', 'isActive', 'createdAt', 'updatedAt', 'supervisorId'],
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens(user);
    return { ...tokens, user: this.sanitize(user) };
  }

  async refresh(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid refresh token');
    const tokens = await this.signTokens(user);
    return tokens;
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private sanitize(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
