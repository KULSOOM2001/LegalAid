export type UserRole = 'citizen' | 'volunteer' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
  isActive: boolean;
  createdAt: string;
}

export type CaseDomain = 'housing' | 'family' | 'employment' | 'immigration' | 'consumer' | 'other';
export type CaseUrgency = 'low' | 'medium' | 'high' | 'critical';
export type CaseStatus =
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_citizen'
  | 'resolved'
  | 'closed';
export type CaseOutcome = 'won' | 'settled' | 'referred' | 'withdrawn' | 'unresolved';

export interface Case {
  id: string;
  title: string;
  description: string;
  domain: CaseDomain | null;
  urgency: CaseUrgency;
  status: CaseStatus;
  outcome: CaseOutcome | null;
  citizenId: string;
  citizen?: User;
  volunteerId: string | null;
  volunteer?: User;
  aiClassificationRationale: string | null;
  statusLogs?: CaseStatusLog[];
  documents?: CaseDocument[];
  notes?: CaseNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CaseStatusLog {
  id: string;
  caseId: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  changedById: string;
  changedBy?: User;
  note: string | null;
  createdAt: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  uploadedById: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  aiSummary: string | null;
  aiUrgentFlag: boolean;
  summaryPending: boolean;
  createdAt: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  author?: User;
  content: string;
  isAiDraft: boolean;
  approved: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  caseId: string;
  citizenId: string;
  volunteerId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Availability {
  id: string;
  volunteerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  meta: Record<string, any>;
  read: boolean;
  createdAt: string;
}
