import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function StatusBreakdownChart({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({ status: d.status.replace('_', ' '), count: d.count }));
  return (
    <div className="card p-4">
      <p className="label mb-3">Cases by status (all-time)</p>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={chartData} outerRadius={80}>
          <PolarGrid stroke="#12233b15" />
          <PolarAngleAxis dataKey="status" tick={{ fontSize: 10, fill: '#5a6b7d' }} />
          <PolarRadiusAxis tick={{ fontSize: 9 }} allowDecimals={false} />
          <Radar name="Cases" dataKey="count" stroke="#12233b" fill="#b98a3d" fillOpacity={0.35} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}