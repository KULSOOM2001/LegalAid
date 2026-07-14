import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { User } from '../../users/entities/user.entity';

@Entity('case_notes')
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (c) => c.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column()
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text' })
  content: string;
  
  @Column({ default: false })
  isAiDraft: boolean;

  @Column({ default: false })
  approved: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
