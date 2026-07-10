import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CaseStatusLog } from './case-status-log.entity';
import { Document } from '../../documents/entities/document.entity';
import { CaseNote } from '../../notes/entities/case-note.entity';
import {
  CaseDomain,
  CaseUrgency,
  CaseStatus,
  CaseOutcome,
  CASE_STATUS_TRANSITIONS,
} from './case.enums';

export { CaseDomain, CaseUrgency, CaseStatus, CaseOutcome, CASE_STATUS_TRANSITIONS };

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: CaseDomain, nullable: true })
  domain: CaseDomain;

  @Column({ type: 'enum', enum: CaseUrgency, default: CaseUrgency.MEDIUM })
  urgency: CaseUrgency;

  @Column({ type: 'enum', enum: CaseStatus, default: CaseStatus.SUBMITTED })
  status: CaseStatus;

  @Column({ type: 'enum', enum: CaseOutcome, nullable: true })
  outcome: CaseOutcome;

  @Column({ nullable: true })
  citizenId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'citizenId' })
  citizen: User;

  @Column({ nullable: true })
  volunteerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column({ type: 'text', nullable: true })
  aiClassificationRationale: string;

  @OneToMany(() => CaseStatusLog, (log) => log.case)
  statusLogs: CaseStatusLog[];

  @OneToMany(() => Document, (doc) => doc.case)
  documents: Document[];

  @OneToMany(() => CaseNote, (note) => note.case)
  notes: CaseNote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}