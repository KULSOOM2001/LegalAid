import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function UtilisationChart({ data }: { data: { volunteerName: string; activeCases: number }[] }) {
  return (
    <div className="card p-4">
      <p className="label mb-3">Volunteer utilisation (active cases)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#12233b10" />
          <XAxis type="number" tick={{ fontSize: 10 }} stroke="#5a6b7d" allowDecimals={false} />
          <YAxis type="category" dataKey="volunteerName" tick={{ fontSize: 10 }} stroke="#5a6b7d" width={100} />
          <Tooltip />
          <Bar dataKey="activeCases" fill="#b98a3d" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
