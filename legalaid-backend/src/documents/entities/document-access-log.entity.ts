import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { User } from '../../users/entities/user.entity';

@Entity('document_access_logs')
export class DocumentAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column()
  accessedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'accessedById' })
  accessedBy: User;

  @Column()
  action: 'view' | 'download';

  @CreateDateColumn()
  createdAt: Date;
}