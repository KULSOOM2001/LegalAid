import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  volunteerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;
}
