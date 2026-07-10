import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { aiApi } from '../../api/cases';
import Button from '../common/Button';

/**
 * Renders only inside volunteer/supervisor CaseDetail — matches the spec's
 * privacy requirement that predicted outcomes are never shown to citizens.
 * Advisory only; badge simply doesn't render if AI is unavailable (no blocking).
 */
export default function OutcomePredictionBadge({ caseId }: { caseId: string }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await aiApi.predictOutcome(caseId);
      if (res.success) setResult(res.data);
      else setUnavailable(true);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  if (unavailable) return null;

  if (!result) {
    return (
      <Button variant="secondary" onClick={predict} disabled={loading}>
        <span className="flex items-center gap-2">
          <Sparkles size={14} />
          {loading ? 'Estimating…' : 'AI outcome estimate (advisory)'}
        </span>
      </Button>
    );
  }

  return (
    <div className="card p-3 border-brass/30 inline-block">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate mb-1">Advisory only — not shown to citizen</p>
      <p className="text-sm">
        <span className="font-medium capitalize">{result.predictedOutcome}</span>{' '}
        <span className="text-xs text-slate">({result.confidence} confidence)</span>
      </p>
      <p className="text-xs text-slate mt-1">{result.rationale}</p>
    </div>
  );
}
