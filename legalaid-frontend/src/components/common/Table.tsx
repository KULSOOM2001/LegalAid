import React from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export default function Table<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyLabel = 'Nothing here yet.',
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left">
            {columns.map((c, i) => (
              <th key={i} className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-slate font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-ink/5 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-ink/[0.03]' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c, i) => (
                <td key={i} className={`px-4 py-3 ${c.className || ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
