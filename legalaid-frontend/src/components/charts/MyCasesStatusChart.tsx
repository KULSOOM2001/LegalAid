import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS: Record<string, string> = {
  submitted: '#b98a3d',
  triaged: '#5a6b7d',
  assigned: '#3d6fb9',
  in_progress: '#3d9db9',
  awaiting_citizen: '#c99a3d',
  resolved: '#3db96a',
  closed: '#12233b',
};

export default function MyCasesStatusChart({ data }: { data: { status: string; count: number }[] }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((d) => ({ name: d.status.replace('_', ' '), value: d.count, key: d.status }));
  return (
    <div className="card p-4 mb-6">
      <p className="label mb-3">Your cases by status</p>
      <ResponsiveContainer width="100%" height={220}>
       <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
         {chartData.map((entry) => (
           <Cell key={entry.key} fill={COLORS[entry.key] || '#12233b'} />
         ))}
        </Pie>
        <Tooltip />
        <Legend />
       </PieChart>
      </ResponsiveContainer>
    </div>
  );
}