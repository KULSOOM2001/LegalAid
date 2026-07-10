import React from 'react';
import type { CaseStatus, CaseUrgency } from '../../types';

const STATUS_LABEL: Record<CaseStatus, string> = {
  submitted: 'Submitted',
  triaged: 'Triaged',
  assigned: 'Assigned',
  in_progress: 'In progress',
  awaiting_citizen: 'Awaiting citizen',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLOR: Record<CaseStatus, string> = {
  submitted: 'border-slate text-slate',
  triaged: 'border-brass text-brass2',
  assigned: 'border-ink text-ink',
  in_progress: 'border-ink text-ink bg-ink/5',
  awaiting_citizen: 'border-warn text-warn',
  resolved: 'border-good text-good',
  closed: 'border-slate/50 text-slate/70',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`seal border ${STATUS_COLOR[status]} px-3 py-1`}>{STATUS_LABEL[status]}</span>;
}

const URGENCY_COLOR: Record<CaseUrgency, string> = {
  low: 'bg-slate/10 text-slate',
  medium: 'bg-brass/15 text-brass2',
  high: 'bg-warn/15 text-warn',
  critical: 'bg-crit/15 text-crit',
};

export function UrgencyPill({ urgency }: { urgency: CaseUrgency }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-wider ${URGENCY_COLOR[urgency]}`}>
      {urgency}
    </span>
  );
}
