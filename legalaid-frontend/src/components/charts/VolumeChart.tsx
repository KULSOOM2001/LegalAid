import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function VolumeChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="card p-4">
      <p className="label mb-3">Case volume (last 30 days)</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b98a3d" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#b98a3d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#12233b10" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#5a6b7d" />
          <YAxis tick={{ fontSize: 10 }} stroke="#5a6b7d" allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke="#b98a3d" fill="url(#volGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
