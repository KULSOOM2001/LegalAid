import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ResolutionTimeChart({ data }: { data: { domain: string; avgHours: string | null }[] }) {
  const chartData = data.map((d) => ({ domain: d.domain, hours: d.avgHours ? parseFloat(d.avgHours) : 0 }));
  return (
    <div className="card p-4">
      <p className="label mb-3">Avg. resolution time by domain (hours)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#12233b10" />
          <XAxis dataKey="domain" tick={{ fontSize: 10 }} stroke="#5a6b7d" />
          <YAxis tick={{ fontSize: 10 }} stroke="#5a6b7d" />
          <Tooltip />
          <Bar dataKey="hours" fill="#12233b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
