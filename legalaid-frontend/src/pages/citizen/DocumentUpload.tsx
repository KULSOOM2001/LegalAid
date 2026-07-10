import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsApi } from '../../api/cases';
import FileUpload from '../../components/common/FileUpload';
import DocumentSummaryCard from '../../components/ai/DocumentSummaryCard';
import type { CaseDocument } from '../../types';

export default function DocumentUpload() {
  const { id } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!id) return;
    const res = await documentsApi.list(id);
    setDocs(res);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 3000);
    return () => clearInterval(poll);
  }, [id]);

  return (
    <div className="max-w-lg">
      <Link to={`/citizen/cases/${id}`} className="text-xs text-slate hover:text-ink">&larr; Back to case</Link>
      <h1 className="font-display text-2xl text-ink mt-2 mb-4">Upload documents</h1>
      <FileUpload onUpload={async (file) => { await documentsApi.upload(id!, file); refresh(); }} />
      <div className="mt-6 space-y-3">
        {!loading && docs.length === 0 && <p className="text-sm text-slate">No documents uploaded yet.</p>}
        {docs.map((d) => <DocumentSummaryCard key={d.id} doc={d} />)}
      </div>
    </div>
  );
}
