import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "users_role_enum" AS ENUM ('citizen','volunteer','supervisor','admin');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "email" varchar UNIQUE NOT NULL,
      "password" varchar NOT NULL,
      "role" "users_role_enum" NOT NULL DEFAULT 'citizen',
      "supervisorId" uuid,
      "isActive" boolean NOT NULL DEFAULT true,
      "maxActiveCases" integer NOT NULL DEFAULT 8,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_users_supervisor" FOREIGN KEY ("supervisorId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "cases_domain_enum" AS ENUM ('housing','family','employment','immigration','consumer','other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "cases_urgency_enum" AS ENUM ('low','medium','high','critical');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "cases_status_enum" AS ENUM ('submitted','triaged','assigned','in_progress','awaiting_citizen','resolved','closed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "cases_outcome_enum" AS ENUM ('won','settled','referred','withdrawn','unresolved');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cases" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "description" text NOT NULL,
      "domain" "cases_domain_enum",
      "urgency" "cases_urgency_enum" NOT NULL DEFAULT 'medium',
      "status" "cases_status_enum" NOT NULL DEFAULT 'submitted',
      "outcome" "cases_outcome_enum",
      "citizenId" uuid,
      "volunteerId" uuid,
      "aiClassificationRationale" text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      "resolvedAt" timestamp,
      CONSTRAINT "fk_cases_citizen" FOREIGN KEY ("citizenId") REFERENCES "users"("id"),
      CONSTRAINT "fk_cases_volunteer" FOREIGN KEY ("volunteerId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "case_status_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "caseId" uuid NOT NULL,
      "fromStatus" "cases_status_enum",
      "toStatus" "cases_status_enum" NOT NULL,
      "changedById" uuid NOT NULL,
      "note" text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_log_case" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_log_changedby" FOREIGN KEY ("changedById") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "documents" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "caseId" uuid NOT NULL,
      "uploadedById" uuid NOT NULL,
      "originalName" varchar NOT NULL,
      "storagePath" varchar NOT NULL,
      "mimeType" varchar NOT NULL,
      "sizeBytes" integer NOT NULL,
      "aiSummary" text,
      "aiUrgentFlag" boolean NOT NULL DEFAULT false,
      "summaryPending" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_doc_case" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_doc_uploadedby" FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "document_access_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "documentId" uuid NOT NULL,
      "accessedById" uuid NOT NULL,
      "action" varchar NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_accesslog_doc" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_accesslog_user" FOREIGN KEY ("accessedById") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "case_notes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "caseId" uuid NOT NULL,
      "authorId" uuid NOT NULL,
      "content" text NOT NULL,
      "isAiDraft" boolean NOT NULL DEFAULT false,
      "approved" boolean NOT NULL DEFAULT false,
      "approvedAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_note_case" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_note_author" FOREIGN KEY ("authorId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "availabilities" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "volunteerId" uuid NOT NULL,
      "dayOfWeek" integer NOT NULL,
      "startTime" varchar NOT NULL,
      "endTime" varchar NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_avail_volunteer" FOREIGN KEY ("volunteerId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "appointments_status_enum" AS ENUM ('requested','confirmed','rescheduled','cancelled','completed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "appointments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "caseId" uuid NOT NULL,
      "citizenId" uuid NOT NULL,
      "volunteerId" uuid NOT NULL,
      "startsAt" timestamp NOT NULL,
      "endsAt" timestamp NOT NULL,
      "status" "appointments_status_enum" NOT NULL DEFAULT 'requested',
      "reminder24hSent" boolean NOT NULL DEFAULT false,
      "reminder1hSent" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_appt_case" FOREIGN KEY ("caseId") REFERENCES "cases"("id"),
      CONSTRAINT "fk_appt_citizen" FOREIGN KEY ("citizenId") REFERENCES "users"("id"),
      CONSTRAINT "fk_appt_volunteer" FOREIGN KEY ("volunteerId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "type" varchar NOT NULL,
      "message" text NOT NULL,
      "meta" jsonb,
      "read" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "fk_notif_user" FOREIGN KEY ("userId") REFERENCES "users"("id")
    )`);

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "ai_interactions_feature_enum" AS ENUM ('classify','summarise_document','draft_letter','predict_outcome');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_interactions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "feature" "ai_interactions_feature_enum" NOT NULL,
      "caseId" varchar,
      "requestedById" varchar,
      "prompt" text NOT NULL,
      "output" text,
      "fallbackFired" boolean NOT NULL DEFAULT false,
      "errorMessage" varchar,
      "latencyMs" integer,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_interactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "case_notes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "case_status_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_interactions_feature_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointments_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cases_outcome_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cases_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cases_urgency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cases_domain_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}