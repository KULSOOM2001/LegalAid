import React from 'react';
import { format } from 'date-fns';
import type { CaseStatusLog } from '../../types';
import { StatusBadge } from './StatusBadge';

export default function StatusTimeline({ logs }: { logs: CaseStatusLog[] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate">No status history yet.</p>;
  }
  const sorted = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <ol className="relative border-l border-ink/15 ml-2">
      {sorted.map((log) => (
        <li key={log.id} className="mb-6 ml-4">
          <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-brass border-2 border-parchment" />
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={log.toStatus} />
            <span className="text-xs text-slate font-mono">
              {format(new Date(log.createdAt), 'd MMM yyyy, HH:mm')}
            </span>
          </div>
          {log.changedBy && (
            <p className="text-xs text-slate mt-1">by {log.changedBy.name}</p>
          )}
          {log.note && <p className="text-sm text-ink mt-1">{log.note}</p>}
        </li>
      ))}
    </ol>
  );
}
