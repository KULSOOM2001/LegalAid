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

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseId: string;

  @ManyToOne(() => Case, (c) => c.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column()
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  originalName: string;

  @Column()
  storagePath: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ default: false })
  aiUrgentFlag: boolean;

  @Column({ default: false })
  summaryPending: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
