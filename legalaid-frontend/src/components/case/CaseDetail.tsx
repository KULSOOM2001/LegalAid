import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { casesApi, notesApi } from '../../api/cases';
import { useAuth } from '../../context/AuthContext';
import type { Case, CaseStatus } from '../../types';
import { StatusBadge, UrgencyPill } from './StatusBadge';
import StatusTimeline from './StatusTimeline';
import DocumentSummaryCard from '../ai/DocumentSummaryCard';
import LetterDraftEditor from '../ai/LetterDraftEditor';
import OutcomePredictionBadge from '../ai/OutcomePredictionBadge';
import Button from '../common/Button';

const NEXT_STATUS_OPTIONS: Record<CaseStatus, CaseStatus[]> = {
  submitted: ['triaged', 'closed'],
  triaged: ['assigned', 'closed'],
  assigned: ['in_progress', 'closed'],
  in_progress: ['awaiting_citizen', 'resolved', 'closed'],
  awaiting_citizen: ['in_progress', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export default function CaseDetail({ basePath }: { basePath: string }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [c, setC] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [outcomeChoice, setOutcomeChoice] = useState('');

  const refresh = async () => {
    if (!id) return;
    try {
      const data = await casesApi.get(id);
      setC(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [id]);

  if (loading) return <p className="text-sm text-slate">Loading…</p>;
  if (error) return <p className="text-sm text-crit">{error}</p>;
  if (!c) return null;

  const isCitizen = user?.role === 'citizen';
  const canDelete = isCitizen && (c.status === 'submitted' || c.status === 'triaged');
  const isVolunteerOrSupervisor = user?.role === 'volunteer' || user?.role === 'supervisor';
  const canChangeStatus = user?.role === 'volunteer' || user?.role === 'supervisor';
  const options = NEXT_STATUS_OPTIONS[c.status] || [];

  const changeStatus = async () => {
    if (!nextStatus) return;
    const updated = await casesApi.updateStatus(c.id, { status: nextStatus, note: statusNote || undefined });
    setC({ ...c, ...updated });
    setNextStatus('');
    setStatusNote('');
    refresh();
  };

  const submitOutcome = async () => {
    if (!outcomeChoice) return;
    const updated = await casesApi.setOutcome(c.id, outcomeChoice);
    setC({ ...c, ...updated });
    setOutcomeChoice('');
    refresh();
  };

  const deleteCase = async () => {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    await casesApi.remove(c.id);
    navigate(basePath);
  };

  return (
    <div className="max-w-3xl">
      <Link to={basePath} className="text-xs text-slate hover:text-ink">&larr; Back</Link>

      <div className="flex items-start justify-between gap-3 mt-2 mb-1">
        <h1 className="font-display text-2xl text-ink">{c.title}</h1>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <UrgencyPill urgency={c.urgency} />
        {c.domain && <span className="text-[10px] font-mono uppercase tracking-wider text-slate">{c.domain}</span>}
        {isVolunteerOrSupervisor && <OutcomePredictionBadge caseId={c.id} />}
      </div>

      <div className="card p-5 mb-6">
        <p className="text-sm text-ink whitespace-pre-wrap">{c.description}</p>
      </div>

      {isCitizen && (
        <div className="flex gap-2 mb-6">
          <Link to={`/citizen/cases/${c.id}/documents`}><Button variant="secondary">Upload documents</Button></Link>
          <Link to={`/citizen/cases/${c.id}/book`}><Button variant="secondary">Book appointment</Button></Link>
          {canDelete && <Button variant="danger" onClick={deleteCase}>Delete case</Button>}
        </div>
      )}

      {canChangeStatus && options.length > 0 && (
        <div className="card p-4 mb-6">
          <p className="label mb-2">Update status (guarded transition)</p>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="input w-auto" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              <option value="">Choose new status…</option>
              {options.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="input flex-1 min-w-[160px]"
              placeholder="Optional note"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
            <Button onClick={changeStatus} disabled={!nextStatus}>Update</Button>
          </div>
        </div>
      )}

      {canChangeStatus && (
        <div className="card p-4 mb-6">
          <p className="label mb-2">
            Case outcome{c.outcome ? ` — currently: ${c.outcome}` : ' (not set yet)'}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="input w-auto" value={outcomeChoice} onChange={(e) => setOutcomeChoice(e.target.value)}>
              <option value="">Choose outcome…</option>
              <option value="won">Won</option>
              <option value="settled">Settled</option>
              <option value="referred">Referred</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="unresolved">Unresolved</option>
            </select>
            <Button onClick={submitOutcome} disabled={!outcomeChoice}>Save outcome</Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-display text-lg text-ink mb-3">Status history</h2>
          <StatusTimeline logs={c.statusLogs || []} />
        </section>

        <section>
          <h2 className="font-display text-lg text-ink mb-3">Documents</h2>
          <div className="space-y-3">
            {(c.documents || []).length === 0 && <p className="text-sm text-slate">No documents yet.</p>}
            {(c.documents || []).map((d) => (
              <DocumentSummaryCard
                key={d.id}
                doc={d}
                onDeleted={(id) => setC((prev: any) => ({
                  ...prev,
                  documents: prev.documents.filter((doc: any) => doc.id !== id),
                }))}
              />
            ))}
          </div>
        </section>
      </div>

      {isVolunteerOrSupervisor && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink mb-3">Notes & letters</h2>
          {user?.role === 'volunteer' && (
            <div className="mb-4">
              <LetterDraftEditor caseId={c.id} onDrafted={() => refresh()} />
            </div>
          )}
          <NotesList caseId={c.id} />
        </section>
      )}
    </div>
  );
}

function NotesList({ caseId }: { caseId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  useEffect(() => {
    notesApi.list(caseId).then(setNotes);
  }, [caseId]);

  if (notes.length === 0) return <p className="text-sm text-slate">No notes yet.</p>;
  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div key={n.id} className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            {n.isAiDraft && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-brass2 bg-brass/10 px-2 py-0.5 rounded-sm">
                {n.approved ? 'AI draft · approved' : 'AI draft · pending'}
              </span>
            )}
            <span className="text-xs text-slate">{n.author?.name}</span>
          </div>
          <p className="text-sm text-ink whitespace-pre-wrap">{n.content}</p>
        </div>
      ))}
    </div>
  );
}