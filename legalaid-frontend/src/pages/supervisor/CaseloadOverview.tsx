import React, { useEffect, useState } from 'react';
import { useCases } from '../../hooks/useCases';
import { casesApi, usersApi } from '../../api/cases';
import Table from '../../components/common/Table';
import { StatusBadge, UrgencyPill } from '../../components/case/StatusBadge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import type { Case, User } from '../../types';

export default function CaseloadOverview() {
  const { cases, loading, refresh } = useCases();
  const navigate = useNavigate();
  const [reassignTarget, setReassignTarget] = useState<Case | null>(null);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    usersApi.volunteers().then(setVolunteers);
  }, []);

  const filtered = statusFilter ? cases.filter((c) => c.status === statusFilter) : cases;

  const doReassign = async () => {
    if (!reassignTarget || !selectedVolunteer) return;
    await casesApi.assign(reassignTarget.id, selectedVolunteer);
    setReassignTarget(null);
    setSelectedVolunteer('');
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Caseload overview</h1>
          <p className="text-sm text-slate">All cases across every volunteer.</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['submitted', 'triaged', 'assigned', 'in_progress', 'awaiting_citizen', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate">Loading…</p>}

      {!loading && (
        <Table<Case>
          rows={filtered}
          onRowClick={(c) => navigate(`/supervisor/cases/${c.id}`)}
          columns={[
            { header: 'Case', render: (c) => <span className="font-medium text-ink">{c.title}</span> },
            { header: 'Domain', render: (c) => <span className="capitalize text-xs">{c.domain || '—'}</span> },
            { header: 'Urgency', render: (c) => <UrgencyPill urgency={c.urgency} /> },
            { header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            { header: 'Volunteer', render: (c) => <span className="text-xs">{c.volunteer?.name || 'Unassigned'}</span> },
            {
              header: 'Actions',
              render: (c) => (
                <button
                  onClick={(e) => { e.stopPropagation(); setReassignTarget(c); }}
                  className="text-xs text-brass2 font-medium hover:underline"
                >
                  Reassign
                </button>
              ),
            },
          ]}
        />
      )}

      <Modal open={!!reassignTarget} onClose={() => setReassignTarget(null)} title={`Reassign "${reassignTarget?.title}"`}>
        <div className="space-y-4">
          <select className="input" value={selectedVolunteer} onChange={(e) => setSelectedVolunteer(e.target.value)}>
            <option value="">Select volunteer…</option>
            {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <Button onClick={doReassign} disabled={!selectedVolunteer}>Confirm reassignment</Button>
        </div>
      </Modal>
    </div>
  );
}
