import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCases } from '../../hooks/useCases';
import CaseCard from '../../components/case/CaseCard';
import Button from '../../components/common/Button';

export default function CitizenDashboard() {
  const { cases, loading, error } = useCases();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Your cases</h1>
          <p className="text-sm text-slate">Track progress and communicate with your volunteer.</p>
        </div>
        <Link to="/citizen/new-case">
          <Button>
            <span className="flex items-center gap-2"><Plus size={15} /> New case</span>
          </Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-slate">Loading…</p>}
      {error && <p className="text-sm text-crit">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.length === 0 && (
            <div className="card p-8 text-center sm:col-span-2">
              <p className="text-sm text-slate mb-3">You haven't submitted a case yet.</p>
              <Link to="/citizen/new-case"><Button>Submit your first case</Button></Link>
            </div>
          )}
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} basePath="/citizen/cases" />
          ))}
        </div>
      )}
    </div>
  );
}
