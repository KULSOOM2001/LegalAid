export enum CaseDomain {
  HOUSING = 'housing',
  FAMILY = 'family',
  EMPLOYMENT = 'employment',
  IMMIGRATION = 'immigration',
  CONSUMER = 'consumer',
  OTHER = 'other',
}

export enum CaseUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CaseStatus {
  SUBMITTED = 'submitted',
  TRIAGED = 'triaged',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  AWAITING_CITIZEN = 'awaiting_citizen',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export const CASE_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.SUBMITTED]: [CaseStatus.TRIAGED, CaseStatus.CLOSED],
  [CaseStatus.TRIAGED]: [CaseStatus.ASSIGNED, CaseStatus.CLOSED],
  [CaseStatus.ASSIGNED]: [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED],
  [CaseStatus.IN_PROGRESS]: [
    CaseStatus.AWAITING_CITIZEN,
    CaseStatus.RESOLVED,
    CaseStatus.CLOSED,
  ],
  [CaseStatus.AWAITING_CITIZEN]: [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED],
  [CaseStatus.RESOLVED]: [CaseStatus.CLOSED, CaseStatus.IN_PROGRESS],
  [CaseStatus.CLOSED]: [],
};

export enum CaseOutcome {
  WON = 'won',
  SETTLED = 'settled',
  REFERRED = 'referred',
  WITHDRAWN = 'withdrawn',
  UNRESOLVED = 'unresolved',
}