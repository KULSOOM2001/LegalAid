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

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.REQUESTED })
  status: AppointmentStatus;

  @Column({ default: false })
  reminder24hSent: boolean;

  @Column({ default: false })
  reminder1hSent: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
