import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { casesApi } from '../../api/cases';
import type { Case } from '../../types';
import { UrgencyPill } from '../case/StatusBadge';

const DOMAINS = ['housing', 'family', 'employment', 'immigration', 'consumer', 'other'];
const URGENCIES = ['low', 'medium', 'high', 'critical'];

/**
 * Polls the case briefly after creation to see if AI Feature 1 (classify) has
 * landed. If it hasn't after a few tries, shows the manual fallback dropdown
 * per the spec's "Classifier fallback: manual dropdown" behaviour.
 */
export default function AIClassifierBanner({ caseId, initialCase }: { caseId: string; initialCase: Case }) {
  const [c, setC] = useState(initialCase);
  const [tries, setTries] = useState(0);
  const [manualDomain, setManualDomain] = useState('');
  const [manualUrgency, setManualUrgency] = useState('medium');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (c.domain) return; // already classified
    if (tries > 6) {
      setShowFallback(true);
      return;
    }
    const t = setTimeout(async () => {
      const fresh = await casesApi.get(caseId);
      setC(fresh);
      setTries((n) => n + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [c.domain, tries, caseId]);

  if (c.domain) {
    return (
      <div className="card p-4 flex items-start gap-3 border-brass/30">
        <Sparkles size={18} className="text-brass mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink">
            AI triage: <span className="capitalize">{c.domain}</span>{' '}
            <UrgencyPill urgency={c.urgency} />
          </p>
          {c.aiClassificationRationale && (
            <p className="text-xs text-slate mt-1">{c.aiClassificationRationale}</p>
          )}
        </div>
      </div>
    );
  }

  if (!showFallback) {
    return (
      <div className="card p-4 flex items-center gap-3 border-ink/10">
        <Sparkles size={18} className="text-slate animate-pulse shrink-0" />
        <p className="text-sm text-slate">AI is classifying this case…</p>
      </div>
    );
  }

  return (
    <div className="card p-4 border-warn/30">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-warn mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">AI triage unavailable — please classify manually</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <select className="input" value={manualDomain} onChange={(e) => setManualDomain(e.target.value)}>
              <option value="">Select domain…</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select className="input" value={manualUrgency} onChange={(e) => setManualUrgency(e.target.value)}>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
