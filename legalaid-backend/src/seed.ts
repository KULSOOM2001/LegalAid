import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from './users/entities/user.entity';
import { Case } from './cases/entities/case.entity';
import { CaseStatusLog } from './cases/entities/case-status-log.entity';
import { Document } from './documents/entities/document.entity';
import { CaseNote } from './notes/entities/case-note.entity';
import { Availability } from './appointments/entities/availability.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Notification } from './notifications/notification.entity';
import { AiInteraction } from './ai-proxy/entities/ai-interaction.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Case, CaseStatusLog, Document, CaseNote, Availability, Appointment, Notification, AiInteraction],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  const usersRepo = dataSource.getRepository(User);

  const existing = await usersRepo.count();
  if (existing > 0) {
    console.log(`Users table already has ${existing} rows — skipping seed. Delete rows or use a fresh DB to reseed.`);
    await dataSource.destroy();
    return;
  }

  const password = await bcrypt.hash('password123', 10);

  const admin = await usersRepo.save(usersRepo.create({ name: 'Ayesha Admin', email: 'admin@legalaid.test', password, role: UserRole.ADMIN }));
  const supervisor = await usersRepo.save(usersRepo.create({ name: 'Bilal Supervisor', email: 'supervisor@legalaid.test', password, role: UserRole.SUPERVISOR }));
  const volunteer1 = await usersRepo.save(usersRepo.create({ name: 'Sara Volunteer', email: 'volunteer1@legalaid.test', password, role: UserRole.VOLUNTEER, supervisorId: supervisor.id }));
  const volunteer2 = await usersRepo.save(usersRepo.create({ name: 'Hamza Volunteer', email: 'volunteer2@legalaid.test', password, role: UserRole.VOLUNTEER, supervisorId: supervisor.id }));
  const citizen1 = await usersRepo.save(usersRepo.create({ name: 'Fatima Citizen', email: 'citizen1@legalaid.test', password, role: UserRole.CITIZEN }));
  const citizen2 = await usersRepo.save(usersRepo.create({ name: 'Usman Citizen', email: 'citizen2@legalaid.test', password, role: UserRole.CITIZEN }));

  console.log('Seeded test accounts (password for all: "password123"):');
  console.log(`  admin@legalaid.test       (admin)      -> ${admin.id}`);
  console.log(`  supervisor@legalaid.test  (supervisor)  -> ${supervisor.id}`);
  console.log(`  volunteer1@legalaid.test  (volunteer)   -> ${volunteer1.id}`);
  console.log(`  volunteer2@legalaid.test  (volunteer)   -> ${volunteer2.id}`);
  console.log(`  citizen1@legalaid.test    (citizen)     -> ${citizen1.id}`);
  console.log(`  citizen2@legalaid.test    (citizen)     -> ${citizen2.id}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
