import React from 'react';
import { useCases } from '../../hooks/useCases';
import { useAuth } from '../../context/AuthContext';
import CaseCard from '../../components/case/CaseCard';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { cases, loading, error } = useCases();

  const assigned = cases.filter((c) => c.volunteerId === user?.id);
  const pool = cases.filter((c) => !c.volunteerId);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Volunteer dashboard</h1>
      <p className="text-sm text-slate mb-6">Your assigned cases and the open case pool.</p>

      {loading && <p className="text-sm text-slate">Loading…</p>}
      {error && <p className="text-sm text-crit">{error}</p>}

      {!loading && (
        <>
          <section className="mb-8">
            <h2 className="font-display text-lg text-ink mb-3">Assigned to you ({assigned.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {assigned.length === 0 && <p className="text-sm text-slate">No cases assigned yet.</p>}
              {assigned.map((c) => <CaseCard key={c.id} c={c} basePath="/volunteer/cases" />)}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">Open case pool ({pool.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pool.length === 0 && <p className="text-sm text-slate">No unassigned cases right now.</p>}
              {pool.map((c) => <CaseCard key={c.id} c={c} basePath="/volunteer/cases" />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
