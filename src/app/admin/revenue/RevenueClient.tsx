'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { FileText, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'

// Lazy-load charts (Recharts is heavy)
const RevenueWaterfallChart = dynamic(
  () => import('./RevenueCharts').then((m) => ({ default: m.RevenueWaterfallChart })),
  { ssr: false, loading: () => <ChartSkeleton height={320} /> }
)
const NetworkRevenueChart = dynamic(
  () => import('./RevenueCharts').then((m) => ({ default: m.NetworkRevenueChart })),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
)
const DealTypeDonut = dynamic(
  () => import('./RevenueCharts').then((m) => ({ default: m.DealTypeDonut })),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
)
const TrendLinesChart = dynamic(
  () => import('./RevenueCharts').then((m) => ({ default: m.TrendLinesChart })),
  { ssr: false, loading: () => <ChartSkeleton height={320} /> }
)

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        fontSize: 12,
      }}
    >
      Loading chart…
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevenueEntry {
  id: string
  venue_id: string
  month: string
  rental_zar: number | null
  revenue_share_zar: number | null
  venues?: {
    id: string
    name: string
    city: string | null
    region: string | null
    gym_brand_id: string | null
    gym_brands?: { name: string } | null
  } | null
}

export interface Venue {
  id: string
  name: string
  city: string | null
  region: string | null
  status: string | null
  active_members: number | null
  gym_brand_id: string | null
  gym_brands?: { name: string } | null
}

export interface Campaign {
  id: string
  name: string
  advertiser: string | null
  start_date: string | null
  end_date: string | null
  amount_charged_zar: number | null
  deal_type: string | null
  cpm_rate: number | null
  revenue_share_percent: number | null
  gym_revenue_share_percent: number | null
}

export interface Contract {
  id: string
  venue_id: string
  monthly_rental_zar: number | null
  revenue_share_percent: number | null
  start_date: string | null
  end_date: string | null
}

export interface RevenueClientProps {
  revenueEntries: RevenueEntry[]
  venues: Venue[]
  campaigns: Campaign[]
  contracts: Contract[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatZAR = (n: number) =>
  'R ' + Math.round(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function fmtMonth(dateStr: string) {
  return new Date(dateStr.slice(0, 7) + '-01').toLocaleDateString('en-ZA', {
    month: 'short',
    year: '2-digit',
  })
}

type DateRange = '3M' | '6M' | '12M' | 'All'

function filterEntriesByRange(entries: RevenueEntry[], range: DateRange): RevenueEntry[] {
  if (range === 'All') return entries
  const now = new Date()
  const months = range === '3M' ? 3 : range === '6M' ? 6 : 12
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  return entries.filter((e) => new Date(e.month.slice(0, 10)) >= cutoff)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RevenueClient({
  revenueEntries,
  venues,
  campaigns,
  contracts,
}: RevenueClientProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>('12M')
  const [monthlyExpanded, setMonthlyExpanded] = useState(false)

  const filteredEntries = useMemo(
    () => filterEntriesByRange(revenueEntries, selectedRange),
    [revenueEntries, selectedRange]
  )

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const totalRev = filteredEntries.reduce(
      (s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0),
      0
    )
    const rentalIncome = filteredEntries.reduce((s, e) => s + (e.rental_zar ?? 0), 0)
    const adRevShare = filteredEntries.reduce((s, e) => s + (e.revenue_share_zar ?? 0), 0)
    const uniqueVenues = new Set(filteredEntries.map((e) => e.venue_id)).size
    const avgPerVenue = uniqueVenues > 0 ? totalRev / uniqueVenues : 0

    // MoM Growth
    const now = new Date()
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

    const thisMonthTotal = revenueEntries
      .filter((e) => e.month.startsWith(thisMonthKey))
      .reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)
    const lastMonthTotal = revenueEntries
      .filter((e) => e.month.startsWith(lastMonthKey))
      .reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)

    const momGrowth =
      lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null

    // Unbilled venues this month
    const billedThisMonth = new Set(
      revenueEntries.filter((e) => e.month.startsWith(thisMonthKey)).map((e) => e.venue_id)
    )
    const unbilledCount = venues.filter(
      (v) => v.status === 'active' && !billedThisMonth.has(v.id)
    ).length

    return { totalRev, rentalIncome, adRevShare, avgPerVenue, momGrowth, unbilledCount }
  }, [filteredEntries, revenueEntries, venues])

  // ── Monthly chart data ────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const map = new Map<string, { rental: number; adRevenue: number }>()
    filteredEntries.forEach((e) => {
      const key = e.month.slice(0, 7)
      const prev = map.get(key) ?? { rental: 0, adRevenue: 0 }
      map.set(key, {
        rental: prev.rental + (e.rental_zar ?? 0),
        adRevenue: prev.adRevenue + (e.revenue_share_zar ?? 0),
      })
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: fmtMonth(key + '-01'),
        rental: val.rental,
        adRevenue: val.adRevenue,
        total: val.rental + val.adRevenue,
      }))
  }, [filteredEntries])

  // ── Network revenue data ──────────────────────────────────────────────────

  const networkData = useMemo(() => {
    const map = new Map<string, number>()
    filteredEntries.forEach((e) => {
      const brandName = e.venues?.gym_brands?.name ?? 'Independent'
      const prev = map.get(brandName) ?? 0
      map.set(brandName, prev + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0))
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, revenue]) => ({ name, revenue }))
  }, [filteredEntries])

  // ── Deal type donut data ──────────────────────────────────────────────────

  const dealTypeData = useMemo(() => {
    const map = new Map<string, number>()
    campaigns.forEach((c) => {
      const type = c.deal_type ?? 'fixed'
      const label =
        type === 'cpm' ? 'CPM' : type === 'revenue_share' ? 'Revenue Share' : 'Fixed Fee'
      map.set(label, (map.get(label) ?? 0) + (c.amount_charged_zar ?? 0))
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [campaigns])

  // ── Trend lines (top 5 venues) ────────────────────────────────────────────

  const { trendData, top5Venues } = useMemo(() => {
    // Aggregate per venue total
    const venueTotals = new Map<string, number>()
    const venueNames = new Map<string, string>()
    filteredEntries.forEach((e) => {
      const total = (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0)
      venueTotals.set(e.venue_id, (venueTotals.get(e.venue_id) ?? 0) + total)
      if (e.venues?.name) venueNames.set(e.venue_id, e.venues.name)
    })
    const top5 = Array.from(venueTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => ({ id, name: venueNames.get(id) ?? id.slice(0, 8) }))

    // Build monthly data per venue
    const monthMap = new Map<string, Record<string, number>>()
    filteredEntries.forEach((e) => {
      if (!top5.find((v) => v.id === e.venue_id)) return
      const monthKey = e.month.slice(0, 7)
      const venueName = venueNames.get(e.venue_id) ?? e.venue_id.slice(0, 8)
      const prev = monthMap.get(monthKey) ?? {}
      monthMap.set(monthKey, {
        ...prev,
        [venueName]: ((prev[venueName] ?? 0) + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0)),
      })
    })

    const trendData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => ({ month: fmtMonth(key + '-01'), ...vals }))

    return { trendData, top5Venues: top5.map((v) => v.name) }
  }, [filteredEntries])

  // ── Venue league table ────────────────────────────────────────────────────

  const leagueTable = useMemo(() => {
    const now = new Date()
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

    const totals = new Map<string, { total: number; mtd: number; lastMonth: number }>()
    const venueInfoMap = new Map<string, RevenueEntry['venues']>()

    revenueEntries.forEach((e) => {
      const rev = (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0)
      const prev = totals.get(e.venue_id) ?? { total: 0, mtd: 0, lastMonth: 0 }
      const isMtd = e.month.startsWith(thisMonthKey)
      const isLast = e.month.startsWith(lastMonthKey)
      totals.set(e.venue_id, {
        total: prev.total + rev,
        mtd: prev.mtd + (isMtd ? rev : 0),
        lastMonth: prev.lastMonth + (isLast ? rev : 0),
      })
      if (e.venues) venueInfoMap.set(e.venue_id, e.venues)
    })

    // Get deal type per venue from contracts
    const contractMap = new Map<string, string>()
    contracts.forEach((c) => {
      if (c.revenue_share_percent && c.revenue_share_percent > 0) {
        contractMap.set(c.venue_id, 'Rev Share')
      } else {
        contractMap.set(c.venue_id, 'Rental')
      }
    })

    return Array.from(totals.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([venueId, stats], idx) => {
        const info = venueInfoMap.get(venueId)
        const mom =
          stats.lastMonth > 0
            ? ((stats.mtd - stats.lastMonth) / stats.lastMonth) * 100
            : null
        return {
          rank: idx + 1,
          venueId,
          name: info?.name ?? '—',
          network: info?.gym_brands?.name ?? '—',
          city: info?.city ?? '—',
          mtd: stats.mtd,
          total: stats.total,
          mom,
          dealType: contractMap.get(venueId) ?? '—',
        }
      })
  }, [revenueEntries, contracts])

  // ── Monthly breakdown table ───────────────────────────────────────────────

  const monthlyTableRows = useMemo(() => {
    const map = new Map<
      string,
      { rental: number; ad: number; venues: Set<string> }
    >()
    filteredEntries.forEach((e) => {
      const key = e.month.slice(0, 7)
      const prev = map.get(key) ?? { rental: 0, ad: 0, venues: new Set() }
      prev.rental += e.rental_zar ?? 0
      prev.ad += e.revenue_share_zar ?? 0
      prev.venues.add(e.venue_id)
      map.set(key, prev)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: fmtMonth(key + '-01'),
        rental: val.rental,
        ad: val.ad,
        total: val.rental + val.ad,
        venueCount: val.venues.size,
        avg: val.venues.size > 0 ? (val.rental + val.ad) / val.venues.size : 0,
      }))
  }, [filteredEntries])

  const monthlyTotals = useMemo(() => {
    const totalRental = monthlyTableRows.reduce((s, r) => s + r.rental, 0)
    const totalAd = monthlyTableRows.reduce((s, r) => s + r.ad, 0)
    const totalTotal = totalRental + totalAd
    const totalVenues = monthlyTableRows.reduce((s, r) => s + r.venueCount, 0)
    return { rental: totalRental, ad: totalAd, total: totalTotal, venueCount: totalVenues }
  }, [monthlyTableRows])

  // ── Export data builder ───────────────────────────────────────────────────

  const buildExportData = () => {
    const rangeLabel =
      selectedRange === 'All' ? 'All Time' : `Last ${selectedRange.replace('M', ' months')}`

    const momStr =
      kpis.momGrowth !== null
        ? `${kpis.momGrowth >= 0 ? '+' : ''}${kpis.momGrowth.toFixed(1)}%`
        : 'N/A'

    return {
      kpis: {
        totalRevenue: formatZAR(kpis.totalRev),
        rentalIncome: formatZAR(kpis.rentalIncome),
        adRevenueShare: formatZAR(kpis.adRevShare),
        momGrowth: momStr,
        avgPerVenue: formatZAR(kpis.avgPerVenue),
        unbilledVenues: String(kpis.unbilledCount),
      },
      monthlyRows: monthlyTableRows.map((r) => [
        r.month,
        r.rental,
        r.ad,
        r.total,
        r.venueCount,
        Math.round(r.avg),
      ]),
      monthlyTotals: [
        'TOTAL',
        monthlyTotals.rental,
        monthlyTotals.ad,
        monthlyTotals.total,
        monthlyTotals.venueCount,
        '',
      ],
      venueRows: leagueTable.map((v) => [
        v.rank,
        v.name,
        v.network,
        v.city,
        v.city, // region fallback
        v.mtd,
        v.total,
        v.dealType,
      ]),
      campaignRows: campaigns.map((c) => [
        c.name,
        c.advertiser ?? '—',
        c.start_date ?? '—',
        c.end_date ?? '—',
        c.deal_type ?? 'fixed',
        c.amount_charged_zar ?? 0,
        c.cpm_rate ?? '—',
        c.gym_revenue_share_percent ?? '—',
      ]),
    }
  }

  const handleExportPDF = async () => {
    const { exportRevenuePDF } = await import('./exportPDF')
    const rangeLabel =
      selectedRange === 'All' ? 'All Time' : `Last ${selectedRange.replace('M', ' months')}`
    exportRevenuePDF(buildExportData(), rangeLabel)
  }

  const handleExportExcel = async () => {
    const { exportRevenueExcel } = await import('./exportExcel')
    const rangeLabel =
      selectedRange === 'All' ? 'All Time' : `Last ${selectedRange.replace('M', ' months')}`
    exportRevenueExcel(buildExportData(), rangeLabel)
  }

  const RANGES: DateRange[] = ['3M', '6M', '12M', 'All']

  const MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div className="p-8 space-y-8">
      {/* ── Hero Panel ────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1
              style={{
                fontFamily: 'Inter Tight, sans-serif',
                fontWeight: 800,
                fontSize: '2.5rem',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Revenue
            </h1>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: 14 }}>
              Financial performance across your gym network
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date range pills */}
            <div className="flex gap-1 p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRange(r)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: selectedRange === r ? '#D4FF4F' : 'transparent',
                    color: selectedRange === r ? '#0A0A0A' : '#A3A3A3',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold glass-card transition-all hover:border-white/20"
              style={{ border: '1px solid rgba(255,107,107,0.25)' }}
            >
              <FileText size={14} color="#FF6B6B" />
              <span style={{ color: '#fff' }}>Export PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold glass-card transition-all hover:border-white/20"
              style={{ border: '1px solid rgba(74,222,128,0.25)' }}
            >
              <FileSpreadsheet size={14} color="#4ADE80" />
              <span style={{ color: '#fff' }}>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Tiles ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiTile
          label="Total Revenue"
          value={formatZAR(kpis.totalRev)}
          sub={`${selectedRange === 'All' ? 'All time' : `Last ${selectedRange}`}`}
          highlight
        />
        <KpiTile label="Rental Income" value={formatZAR(kpis.rentalIncome)} sub="Period total" />
        <KpiTile label="Ad Revenue Share" value={formatZAR(kpis.adRevShare)} sub="Period total" />
        <KpiTile
          label="MoM Growth"
          value={
            kpis.momGrowth !== null
              ? `${kpis.momGrowth >= 0 ? '↑' : '↓'} ${Math.abs(kpis.momGrowth).toFixed(1)}%`
              : 'N/A'
          }
          sub="vs last month"
          valueColor={
            kpis.momGrowth === null
              ? '#fff'
              : kpis.momGrowth >= 0
              ? '#4ADE80'
              : '#FF6B6B'
          }
        />
        <KpiTile
          label="Avg Revenue / Venue"
          value={formatZAR(kpis.avgPerVenue)}
          sub={`Across ${new Set(filteredEntries.map((e) => e.venue_id)).size} venues`}
        />
        <KpiTile
          label="Unbilled Venues"
          value={String(kpis.unbilledCount)}
          sub="Active · no entry this month"
          valueColor={kpis.unbilledCount > 0 ? '#FF6B6B' : '#4ADE80'}
        />
      </div>

      {/* ── Chart 1 — Revenue Waterfall ───────────────────────────────────── */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#909090' }}>
          Monthly Revenue Breakdown
        </h2>
        <RevenueWaterfallChart data={monthlyData} />
      </div>

      {/* ── Charts 2+3 — side by side ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#909090' }}>
            Revenue by Network
          </h2>
          <NetworkRevenueChart data={networkData} />
        </div>
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#909090' }}>
            Revenue by Deal Type
          </h2>
          {dealTypeData.length > 0 ? (
            <DealTypeDonut data={dealTypeData} />
          ) : (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#555' }}>
              No campaign data
            </div>
          )}
        </div>
      </div>

      {/* ── Chart 4 — Trend Lines ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: '#909090' }}>
          Top Venue Revenue Trends
        </h2>
        {top5Venues.length > 0 ? (
          <TrendLinesChart data={trendData} venues={top5Venues} />
        ) : (
          <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#555' }}>
            Not enough data
          </div>
        )}
      </div>

      {/* ── Venue League Table ────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#909090' }}>
            Venue Revenue League Table
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Rank', 'Venue', 'Network', 'City', 'MTD Revenue', 'Total Revenue', 'MoM', 'Deal'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leagueTable.map((row, idx) => (
                <tr
                  key={row.venueId}
                  style={{
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <td className="px-5 py-3.5 text-sm font-bold tabular-nums" style={{ color: '#fff' }}>
                    {row.rank <= 3 ? MEDAL[row.rank - 1] : row.rank}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-white">{row.name}</p>
                    <p className="text-xs" style={{ color: '#666' }}>{row.city}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#A3A3A3' }}>{row.network}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#A3A3A3' }}>{row.city}</td>
                  <td className="px-5 py-3.5 text-sm font-mono tabular-nums" style={{ color: '#A3A3A3' }}>
                    {formatZAR(row.mtd)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono font-semibold tabular-nums" style={{ color: '#D4FF4F' }}>
                    {formatZAR(row.total)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold tabular-nums">
                    {row.mom !== null ? (
                      <span style={{ color: row.mom >= 0 ? '#4ADE80' : '#FF6B6B' }}>
                        {row.mom >= 0 ? '↑' : '↓'} {Math.abs(row.mom).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: '#555' }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium" style={{ color: '#A3A3A3' }}>
                    {row.dealType}
                  </td>
                </tr>
              ))}
              {leagueTable.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm" style={{ color: '#555' }}>
                    No revenue data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Monthly Breakdown Table (collapsible) ────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setMonthlyExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-5"
          style={{ borderBottom: monthlyExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#909090' }}>
            Monthly Breakdown
          </h2>
          {monthlyExpanded ? (
            <ChevronUp size={16} color="#666" />
          ) : (
            <ChevronDown size={16} color="#666" />
          )}
        </button>

        {monthlyExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Month', 'Rental', 'Ad Revenue', 'Total', 'Venues Billed', 'Avg / Venue'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTableRows.map((row, idx) => (
                  <tr
                    key={row.month}
                    style={{
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td className="px-5 py-3 text-sm font-medium text-white">{row.month}</td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums" style={{ color: '#A3A3A3' }}>
                      {formatZAR(row.rental)}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums" style={{ color: '#A3A3A3' }}>
                      {formatZAR(row.ad)}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono font-semibold tabular-nums" style={{ color: '#D4FF4F' }}>
                      {formatZAR(row.total)}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums text-center" style={{ color: '#A3A3A3' }}>
                      {row.venueCount}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums" style={{ color: '#A3A3A3' }}>
                      {formatZAR(row.avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(212,255,79,0.2)', background: 'rgba(212,255,79,0.04)' }}>
                  <td className="px-5 py-3 text-sm font-bold" style={{ color: '#D4FF4F' }}>TOTAL</td>
                  <td className="px-5 py-3 text-sm font-bold font-mono tabular-nums" style={{ color: '#D4FF4F' }}>
                    {formatZAR(monthlyTotals.rental)}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold font-mono tabular-nums" style={{ color: '#D4FF4F' }}>
                    {formatZAR(monthlyTotals.ad)}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold font-mono tabular-nums" style={{ color: '#D4FF4F' }}>
                    {formatZAR(monthlyTotals.total)}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold tabular-nums text-center" style={{ color: '#D4FF4F' }}>
                    {monthlyTotals.venueCount}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── KPI Tile Component ──────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  sub,
  highlight,
  valueColor,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  valueColor?: string
}) {
  return (
    <div
      className="glass-card rounded-2xl p-6"
      style={{
        border: highlight ? '1px solid rgba(212,255,79,0.2)' : undefined,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: '#909090' }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-extrabold tabular-nums mb-1 leading-none"
        style={{
          fontFamily: 'Inter Tight, sans-serif',
          letterSpacing: '-0.02em',
          color: valueColor ?? (highlight ? '#D4FF4F' : '#FFFFFF'),
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: '#666' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
