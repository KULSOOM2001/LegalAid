import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCases } from '../../hooks/useCases';
import { casesApi } from '../../api/cases';
import CaseCard from '../../components/case/CaseCard';
import MyCasesStatusChart from '../../components/charts/MyCasesStatusChart';
import Button from '../../components/common/Button';

export default function CitizenDashboard() {
  const { cases, loading, error } = useCases();
  const [statusData, setStatusData] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    casesApi.myStatusBreakdown().then(setStatusData).catch(() => {});
  }, [cases.length]);

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

      {!loading && !error && cases.length > 0 && <MyCasesStatusChart data={statusData} />}

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