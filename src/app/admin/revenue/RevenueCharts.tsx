'use client'

import {
  ComposedChart,
  Bar,
  Line,
  BarChart,
  PieChart,
  Pie,
  Cell,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const LIME = '#D4FF4F'
const GREY = '#A3A3A3'
const WHITE = '#FFFFFF'
const LIME_SHADES = ['#D4FF4F', '#B8E620', '#9CCB00', '#80B000', '#649500']

const glassTip = {
  contentStyle: {
    background: 'rgba(20,20,20,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 12,
  },
  itemStyle: { color: '#fff' },
  labelStyle: { color: LIME, fontWeight: 700 },
}

const formatZAR = (n: number) =>
  'R ' + Math.round(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// ── Chart 1 — Revenue Waterfall ────────────────────────────────────────────

interface WaterfallDataPoint {
  month: string
  rental: number
  adRevenue: number
  total: number
}

interface RevenueWaterfallChartProps {
  data: WaterfallDataPoint[]
}

export function RevenueWaterfallChart({ data }: RevenueWaterfallChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: GREY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `R ${(v / 1000).toFixed(0)}k`}
          tick={{ fill: GREY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(val, name) => [
            formatZAR(Number(val)),
            name === 'rental' ? 'Rental' : name === 'adRevenue' ? 'Ad Revenue' : 'Total',
          ]}
          {...glassTip}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: GREY }}
          formatter={(val) =>
            val === 'rental' ? 'Rental' : val === 'adRevenue' ? 'Ad Revenue Share' : 'Total Trend'
          }
        />
        <Bar dataKey="rental" stackId="a" fill={LIME} radius={[0, 0, 0, 0]} />
        <Bar dataKey="adRevenue" stackId="a" fill={GREY} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="total"
          stroke={WHITE}
          strokeWidth={2}
          dot={{ fill: WHITE, r: 3, strokeWidth: 0 }}
          activeDot={{ fill: LIME, r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Chart 2 — Revenue by Network ──────────────────────────────────────────

interface NetworkDataPoint {
  name: string
  revenue: number
}

interface NetworkRevenueChartProps {
  data: NetworkDataPoint[]
}

export function NetworkRevenueChart({ data }: NetworkRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `R ${(v / 1000).toFixed(0)}k`}
          tick={{ fill: GREY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#fff', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          formatter={(val) => [formatZAR(Number(val)), 'Revenue']}
          {...glassTip}
        />
        <Bar dataKey="revenue" fill={LIME} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Chart 3 — Deal Type Donut ──────────────────────────────────────────────

interface DealTypeDataPoint {
  name: string
  value: number
}

interface DealTypeDonutProps {
  data: DealTypeDataPoint[]
}

const DONUT_COLORS = [LIME, GREY, WHITE, '#6B7280', '#4ADE80']

export function DealTypeDonut({ data }: DealTypeDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: GREY }}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(val) => [
            formatZAR(Number(val)),
            `${total > 0 ? ((Number(val) / total) * 100).toFixed(1) : 0}%`,
          ]}
          {...glassTip}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Chart 4 — Trend Lines (top 5 venues) ─────────────────────────────────

interface TrendDataPoint {
  month: string
  [venueName: string]: string | number
}

interface TrendLinesChartProps {
  data: TrendDataPoint[]
  venues: string[]
}

export function TrendLinesChart({ data, venues }: TrendLinesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: GREY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `R ${(v / 1000).toFixed(0)}k`}
          tick={{ fill: GREY, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip formatter={(val) => [formatZAR(Number(val))]} {...glassTip} />
        <Legend wrapperStyle={{ fontSize: 11, color: GREY }} />
        {venues.map((venue, i) => (
          <Line
            key={venue}
            type="monotone"
            dataKey={venue}
            stroke={LIME_SHADES[i % LIME_SHADES.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: LIME_SHADES[i % LIME_SHADES.length] }}
            strokeOpacity={1 - i * 0.12}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
