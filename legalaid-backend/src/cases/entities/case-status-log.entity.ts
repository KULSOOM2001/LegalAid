import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';
import { CaseStatus } from './case.enums';
import { User } from '../../users/entities/user.entity';

@Entity('case_status_logs')
export class CaseStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (c) => c.statusLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column({ type: 'enum', enum: CaseStatus, nullable: true })
  fromStatus: CaseStatus;

  @Column({ type: 'enum', enum: CaseStatus })
  toStatus: CaseStatus;

  @Column()
  changedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changedById' })
  changedBy: User;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
