import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { notesApi } from '../../api/cases';
import type { CaseNote } from '../../types';
import Button from '../common/Button';

export default function LetterDraftEditor({ caseId, onDrafted }: { caseId: string; onDrafted: (n: CaseNote) => void }) {
  const [roughNote, setRoughNote] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<CaseNote | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestDraft = async () => {
    if (!roughNote.trim()) return;
    setDrafting(true);
    setError(null);
    try {
      const note = await notesApi.create(caseId, { content: roughNote, draft: true });
      setDraft(note);
      setEditedContent(note.content);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not create draft.');
    } finally {
      setDrafting(false);
    }
  };

  const approve = async () => {
    if (!draft) return;
    setApproving(true);
    try {
      const approved = await notesApi.approve(draft.id, editedContent);
      onDrafted(approved);
      setDraft(null);
      setRoughNote('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not approve.');
    } finally {
      setApproving(false);
    }
  };

  if (!draft) {
    return (
      <div className="card p-4">
        <label className="label">Rough note / instructions for the letter</label>
        <textarea
          className="input min-h-[100px]"
          value={roughNote}
          onChange={(e) => setRoughNote(e.target.value)}
          placeholder="e.g. Write a letter to the landlord requesting a 30-day extension due to..."
        />
        {error && <p className="text-xs text-crit mt-2">{error}</p>}
        <div className="mt-3">
          <Button variant="brass" onClick={requestDraft} disabled={drafting || !roughNote.trim()}>
            <span className="flex items-center gap-2">
              <Sparkles size={14} />
              {drafting ? 'Drafting…' : 'Draft with AI'}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 border-brass/30">
      <p className="text-xs font-mono uppercase tracking-wider text-brass2 mb-2">AI draft — review before sending</p>
      <textarea
        className="input min-h-[220px] font-body"
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
      />
      {error && <p className="text-xs text-crit mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={approve} disabled={approving}>
          <span className="flex items-center gap-2">
            <Check size={14} />
            {approving ? 'Approving…' : 'Edit & approve'}
          </span>
        </Button>
        <Button variant="secondary" onClick={() => setDraft(null)}>Discard</Button>
      </div>
    </div>
  );
}
