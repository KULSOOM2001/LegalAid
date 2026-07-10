import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentsApi, usersApi } from '../../api/cases';
import Button from '../../components/common/Button';
import type { User } from '../../types';

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [volunteerId, setVolunteerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    usersApi.volunteers().then(setVolunteers);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`);
      const endsAt = new Date(startsAt.getTime() + duration * 60000);
      await appointmentsApi.book({
        caseId: id!,
        volunteerId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not book appointment — try a different time.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md">
        <h1 className="font-display text-2xl text-ink mb-2">Appointment requested</h1>
        <p className="text-sm text-slate mb-4">Your volunteer will confirm it shortly.</p>
        <Button onClick={() => navigate(`/citizen/cases/${id}`)}>Back to case</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <Link to={`/citizen/cases/${id}`} className="text-xs text-slate hover:text-ink">&larr; Back to case</Link>
      <h1 className="font-display text-2xl text-ink mt-2 mb-4">Book an appointment</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Volunteer</label>
          <select className="input" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)} required>
            <option value="">Select a volunteer…</option>
            {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Time</label>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input className="input" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} />
        </div>
        {error && <p className="text-xs text-crit">{error}</p>}
        <Button type="submit" disabled={submitting}>{submitting ? 'Booking…' : 'Request appointment'}</Button>
      </form>
    </div>
  );
}
