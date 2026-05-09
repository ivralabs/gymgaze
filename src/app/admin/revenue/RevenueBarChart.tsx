"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface ChartEntry {
  month: string;
  campaigns: number;
  sponsorships: number;
  total: number;
}

interface Props {
  data: ChartEntry[];
}

const fmtR = (n: number) =>
  "R " +
  Math.round(n).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 180,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: "#666" }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          className="flex items-center justify-between gap-6 text-sm mb-1"
        >
          <span style={{ color: p.color, fontSize: 12, fontWeight: 500 }}>
            {p.name}
          </span>
          <span
            style={{
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {fmtR(p.value)}
          </span>
        </div>
      ))}
      <div
        className="flex items-center justify-between text-sm mt-2 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span style={{ color: "#888", fontSize: 12 }}>Total</span>
        <span
          style={{
            color: "#D4FF4F",
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {fmtR(total)}
        </span>
      </div>
    </div>
  );
}

export default function RevenueBarChart({ data }: Props) {
  const hasData = data.some((d) => d.campaigns > 0 || d.sponsorships > 0);

  if (!hasData) {
    return (
      <div
        style={{
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 13,
        }}
      >
        No revenue data for the last 6 months
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 24, right: 8, left: 8, bottom: 0 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#666", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#555", fontSize: 10 }}
          tickFormatter={(v: number) => (v >= 1000 ? `R ${v / 1000}k` : `R ${v}`)}
          width={64}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#888", paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="campaigns" name="Campaigns" fill="#FF6B35" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="total"
            position="top"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => {
              const n = Number(v);
              if (!n || n <= 0) return "";
              return `R ${n >= 1000 ? (n / 1000).toFixed(0) + "k" : n}`;
            }}
            style={{ fill: "#888", fontSize: 10 }}
          />
        </Bar>
        <Bar
          dataKey="sponsorships"
          name="Sponsorships"
          fill="#A78BFA"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
