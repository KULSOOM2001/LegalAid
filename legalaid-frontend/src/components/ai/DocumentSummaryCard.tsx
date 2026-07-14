
import React, { useState } from 'react';
import { FileText, AlertCircle, Download, Trash2 } from 'lucide-react';
import type { CaseDocument } from '../../types';
import { documentsApi } from '../../api/cases';

export default function DocumentSummaryCard({
  doc,
  onDeleted,
}: {
  doc: CaseDocument;
  onDeleted?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async () => {
    try {
      await documentsApi.download(doc.id, doc.originalName);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await documentsApi.delete(doc.id);
      onDeleted?.(doc.id);
    } catch (err) {
      console.error('Delete failed', err);
      setDeleting(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <FileText size={16} className="text-slate mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">{doc.originalName}</p>
            <p className="text-[10px] font-mono text-slate uppercase tracking-wider">
              {(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.mimeType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownload} className="text-slate hover:text-ink" title="Download">
            <Download size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-slate hover:text-crit disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 pl-6">
        {doc.summaryPending ? (
          <p className="text-xs text-slate italic">AI is summarising this document…</p>
        ) : (
          <div className={`text-sm rounded p-3 ${doc.aiUrgentFlag ? 'bg-warn/10' : 'bg-ink/5'}`}>
            {doc.aiUrgentFlag && (
              <p className="flex items-center gap-1 text-warn text-xs font-medium mb-1">
                <AlertCircle size={12} /> Flagged urgent
              </p>
            )}
            <p className="text-ink">{doc.aiSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
