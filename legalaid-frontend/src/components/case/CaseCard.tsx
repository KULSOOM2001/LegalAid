import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Case } from '../../types';
import { StatusBadge, UrgencyPill } from './StatusBadge';

export default function CaseCard({ c, basePath }: { c: Case; basePath: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`${basePath}/${c.id}`)}
      className="card p-4 text-left w-full hover:border-brass/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base text-ink leading-snug">{c.title}</p>
          <p className="text-xs text-slate mt-1 line-clamp-2">{c.description}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <UrgencyPill urgency={c.urgency} />
        {c.domain && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate">{c.domain}</span>
        )}
        <span className="text-[10px] text-slate ml-auto">
          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
