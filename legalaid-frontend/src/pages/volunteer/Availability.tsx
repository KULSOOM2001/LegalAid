import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { appointmentsApi } from '../../api/cases';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import type { Availability } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VolunteerAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) return;
    const res = await appointmentsApi.getAvailability(user.id);
    setSlots(res);
  };

  useEffect(() => { refresh(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await appointmentsApi.setAvailability({ dayOfWeek, startTime, endTime });
      refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save slot');
    }
  };

  const remove = async (id: string) => {
    try {
      await appointmentsApi.deleteAvailability(id);
      refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not delete slot');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-ink mb-1">Your availability</h1>
      <p className="text-sm text-slate mb-6">Recurring weekly slots used for appointment conflict detection.</p>

      <form onSubmit={add} className="card p-4 flex flex-wrap gap-3 items-end mb-6">
        <div>
          <label className="label">Day</label>
          <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Start</label>
          <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="label">End</label>
          <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <Button type="submit">Add slot</Button>
      </form>
      {error && <p className="text-xs text-crit mb-4">{error}</p>}

      <div className="card divide-y divide-ink/5">
        {slots.length === 0 && <p className="p-4 text-sm text-slate">No slots set yet.</p>}
        {slots.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{DAYS[s.dayOfWeek]}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate">{s.startTime} – {s.endTime}</span>
              <button onClick={() => remove(s.id)} className="text-slate hover:text-crit transition-colors" title="Delete slot">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}