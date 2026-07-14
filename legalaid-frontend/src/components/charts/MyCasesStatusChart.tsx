import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_META: Record<string, { color: string; light: string }> = {
  submitted:         { color: "#F59E0B", light: "#FEF3C7" },
  triaged:           { color: "#8B5CF6", light: "#EDE9FE" },
  assigned:          { color: "#3B82F6", light: "#DBEAFE" },
  in_progress:       { color: "#06B6D4", light: "#CFFAFE" },
  awaiting_citizen:  { color: "#F97316", light: "#FFEDD5" },
  resolved:          { color: "#22C55E", light: "#DCFCE7" },
  closed:            { color: "#475569", light: "#E2E8F0" },
};

const FALLBACK = { color: "#94A3B8", light: "#F1F5F9" };

function label(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MyCasesStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { chartData, total } = useMemo(() => {
    const total = data?.reduce((sum, d) => sum + d.count, 0) || 0;
    const chartData = (data || [])
      .filter((d) => d.count > 0)
      .map((d) => ({
        key: d.status,
        name: label(d.status),
        value: d.count,
        pct: total ? Math.round((d.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return { chartData, total };
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 mb-6 shadow-sm text-center">
        <p className="text-sm text-slate-400">No cases yet — your status breakdown will show up here.</p>
      </div>
    );
  }

  const active = chartData.find((d) => d.key === activeKey);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-violet-200/40 to-cyan-200/40 blur-3xl" />

      <div className="relative flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-slate-800 tracking-tight">
          Your cases by status
        </h3>
        <span className="text-xs font-medium text-slate-400">{total} total</span>
      </div>

      <div className="relative flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full sm:w-[220px] h-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((entry) => {
                  const meta = STATUS_META[entry.key] || FALLBACK;
                  return (
                    <linearGradient key={entry.key} id={`grad-${entry.key}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={meta.color} stopOpacity={0.75} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={4}
                cornerRadius={8}
                stroke="none"
                onMouseEnter={(_, i) => setActiveKey(chartData[i].key)}
                onMouseLeave={() => setActiveKey(null)}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={`url(#grad-${entry.key})`}
                    style={{
                      filter: activeKey && activeKey !== entry.key ? "opacity(0.35)" : "opacity(1)",
                      transition: "filter 180ms ease",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0F172A",
                  border: "none",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#94A3B8" }}
                formatter={(value: number, name: string) => [`${value} cases`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800 tabular-nums">
              {active ? active.value : total}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              {active ? active.name : "Total cases"}
            </span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-1.5">
          {chartData.map((entry) => {
            const meta = STATUS_META[entry.key] || FALLBACK;
            const isActive = activeKey === entry.key;
            return (
              <button
                key={entry.key}
                onMouseEnter={() => setActiveKey(entry.key)}
                onMouseLeave={() => setActiveKey(null)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 ${
                  isActive ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-sm text-slate-600 flex-1 truncate">{entry.name}</span>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{entry.value}</span>
                <span className="text-xs text-slate-400 w-9 text-right tabular-nums">{entry.pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}