import React from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-lg border border-ink/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="text-slate hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
