import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi } from '../../api/cases';
import Button from '../../components/common/Button';
import AIClassifierBanner from '../../components/ai/AIClassifierBanner';
import type { Case } from '../../types';

export default function NewCase() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Case | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const c = await casesApi.create({ title, description });
      setCreated(c);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not submit case');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-2xl text-ink mb-1">Case submitted</h1>
        <p className="text-sm text-slate mb-4">"{created.title}" has been received.</p>
        <div className="mb-4">
          <AIClassifierBanner caseId={created.id} initialCase={created} />
        </div>
        <Button onClick={() => navigate(`/citizen/cases/${created.id}`)}>Go to case</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-ink mb-1">Submit a new case</h1>
      <p className="text-sm text-slate mb-6">
        Describe your situation. Our AI will help triage it, then a volunteer will follow up.
      </p>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Case title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eviction notice from landlord" required />
        </div>
        <div>
          <label className="label">Describe your situation</label>
          <textarea
            className="input min-h-[160px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Include dates, names, and what outcome you're hoping for."
            required
          />
        </div>
        {error && <p className="text-xs text-crit">{error}</p>}
        <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit case'}</Button>
      </form>
    </div>
  );
}
