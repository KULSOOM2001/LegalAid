import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Case } from '../../cases/entities/case.entity';

export enum AppointmentStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column()
  citizenId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'citizenId' })
  citizen: User;

  @Column()
  volunteerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.REQUESTED })
  status: AppointmentStatus;

  @Column({ default: false })
  reminder24hSent: boolean;

  @Column({ default: false })
  reminder1hSent: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
