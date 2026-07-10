import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#2f6b4f', '#b98a3d', '#5a6b7d', '#a8501b', '#9e2b25'];

export default function OutcomeChart({ data }: { data: { outcome: string; count: number }[] }) {
  return (
    <div className="card p-4">
      <p className="label mb-3">Case outcomes</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="outcome" innerRadius={45} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
