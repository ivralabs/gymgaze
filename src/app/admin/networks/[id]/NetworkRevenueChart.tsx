"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface NetworkRevenueChartProps {
  data: RevenueDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(20,20,20,0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        <p style={{ color: "#C8C8C8", fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: "#D4FF4F", fontSize: 14, fontWeight: 700 }}>
          R {(payload[0].value ?? 0).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
}

export default function NetworkRevenueChart({ data }: NetworkRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4FF4F" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#D4FF4F" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#666", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#666", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#D4FF4F"
          strokeWidth={2}
          fill="url(#limeGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#D4FF4F", stroke: "#000" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
