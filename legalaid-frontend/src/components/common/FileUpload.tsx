import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({
  onUpload,
  accept = '.pdf,.png,.jpg,.jpeg,.webp',
  label = 'Upload document',
}: {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10MB limit.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full border-2 border-dashed border-ink/20 rounded p-6 flex flex-col items-center gap-2 text-slate hover:border-brass hover:text-ink transition-colors disabled:opacity-50"
      >
        <UploadCloud size={22} />
        <span className="text-sm font-medium">{busy ? 'Uploading…' : label}</span>
        <span className="text-xs">PDF or image, up to 10MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-crit mt-2">{error}</p>}
    </div>
  );
}
