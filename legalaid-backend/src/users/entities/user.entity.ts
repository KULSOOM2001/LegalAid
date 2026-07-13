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

export enum UserRole {
  CITIZEN = 'citizen',
  VOLUNTEER = 'volunteer',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CITIZEN })
  role: UserRole;

  @Column({ nullable: true })
  supervisorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisorId' })
  supervisor: User;

  @OneToMany(() => User, (u) => u.supervisor)
  volunteers: User[];

  @Column({ default: true })
  isActive: boolean;

  // Capacity limit: max concurrent active (non-closed) cases this volunteer can hold.
  @Column({ type: 'int', default: 8 })
  maxActiveCases: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
