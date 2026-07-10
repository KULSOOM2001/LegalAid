import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AiFeature {
  CLASSIFY = 'classify',
  SUMMARISE_DOCUMENT = 'summarise_document',
  DRAFT_LETTER = 'draft_letter',
  PREDICT_OUTCOME = 'predict_outcome',
}

@Entity('ai_interactions')
export class AiInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AiFeature })
  feature: AiFeature;

  @Column({ nullable: true })
  caseId: string;

  @Column({ nullable: true })
  requestedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  output: string;

  @Column({ default: false })
  fallbackFired: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
