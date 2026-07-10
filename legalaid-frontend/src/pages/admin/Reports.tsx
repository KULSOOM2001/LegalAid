import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/cases';
import VolumeChart from '../../components/charts/VolumeChart';
import ResolutionTimeChart from '../../components/charts/ResolutionTimeChart';
import OutcomeChart from '../../components/charts/OutcomeChart';
import UtilisationChart from '../../components/charts/UtilisationChart';
import StatusBreakdownChart from '../../components/charts/StatusBreakdownChart';

export default function Reports() {
  const [volume, setVolume] = useState<any[]>([]);
  const [resolutionTime, setResolutionTime] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [utilisation, setUtilisation] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.volume(),
      adminApi.resolutionTime(),
      adminApi.outcomes(),
      adminApi.utilisation(),
      adminApi.statusBreakdown(),
    ]).then(([v, r, o, u, s]) => {
      setVolume(v); setResolutionTime(r); setOutcomes(o); setUtilisation(u); setStatusBreakdown(s);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Reports</h1>
      <p className="text-sm text-slate mb-6">Read-only aggregation across all cases and volunteers.</p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <VolumeChart data={volume} />
          <ResolutionTimeChart data={resolutionTime} />
          <OutcomeChart data={outcomes} />
          <UtilisationChart data={utilisation} />
          <StatusBreakdownChart data={statusBreakdown} />
        </div>
      )}
    </div>
  );
}