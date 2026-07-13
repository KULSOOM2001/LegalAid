import React, { useEffect, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { appointmentsApi } from '../../api/cases';
import Button from '../../components/common/Button';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-warn/10 text-warn',
  confirmed: 'bg-brass/10 text-brass',
  rescheduled: 'bg-brass/10 text-brass',
  cancelled: 'bg-slate/10 text-slate',
  completed: 'bg-slate/10 text-slate',
};

export default function VolunteerAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list();
      setAppointments(res || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const act = async (id: string, action: 'confirm' | 'cancel') => {
    setBusyId(id);
    try {
      await appointmentsApi.update(id, { action });
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Appointment requests</h1>
      <p className="text-sm text-slate mb-6">Confirm or cancel appointments requested by citizens.</p>

      {loading && <p className="text-sm text-slate">Loading…</p>}
      {error && <p className="text-sm text-crit mb-4">{error}</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-sm text-slate">No appointment requests yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {appointments.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[a.status] || ''}`}>
                {a.status}
              </span>
              <span className="text-xs text-slate flex items-center gap-1">
                <Clock size={12} />
                {new Date(a.startsAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-medium text-ink">{a.case?.title || 'Case'}</p>
            <p className="text-xs text-slate mt-1">Citizen: {a.citizen?.name || a.citizenId}</p>

            {a.status === 'requested' && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => act(a.id, 'confirm')}
                  disabled={busyId === a.id}
                >
                  <Check size={14} className="mr-1" /> Confirm
                </Button>
                <button
                  onClick={() => act(a.id, 'cancel')}
                  disabled={busyId === a.id}
                  className="text-sm text-crit hover:underline flex items-center gap-1"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}