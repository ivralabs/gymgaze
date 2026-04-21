import * as XLSX from 'xlsx'
import { RevenueExportData } from './exportPDF'

export function exportRevenueExcel(data: RevenueExportData, dateRange: string) {
  const wb = XLSX.utils.book_new()

  // SHEET 1 — Summary
  const summaryData = [
    ['GYMGAZE REVENUE REPORT', '', '', ''],
    [`Period: ${dateRange}`, '', '', ''],
    [`Generated: ${new Date().toLocaleDateString('en-ZA')}`, '', '', ''],
    ['', '', '', ''],
    ['KPI', 'VALUE', '', ''],
    ['Total Revenue', data.kpis.totalRevenue, '', ''],
    ['Rental Income', data.kpis.rentalIncome, '', ''],
    ['Ad Revenue Share', data.kpis.adRevenueShare, '', ''],
    ['MoM Growth', data.kpis.momGrowth, '', ''],
    ['Avg Revenue Per Venue', data.kpis.avgPerVenue, '', ''],
    ['Unbilled Venues', data.kpis.unbilledVenues, '', ''],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // SHEET 2 — Monthly Revenue
  const monthlyHeaders = [
    'Month',
    'Rental (ZAR)',
    'Ad Revenue Share (ZAR)',
    'Total Revenue (ZAR)',
    'Venues Billed',
    'Avg Per Venue (ZAR)',
  ]
  const monthlySheet = XLSX.utils.aoa_to_sheet([
    monthlyHeaders,
    ...data.monthlyRows,
    data.monthlyTotals,
  ])
  monthlySheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 14 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Revenue')

  // SHEET 3 — Venues
  const venueHeaders = [
    'Rank',
    'Venue',
    'Network',
    'City',
    'Region',
    'MTD Revenue (ZAR)',
    'Total Revenue (ZAR)',
    'Deal Type',
  ]
  const venueSheet = XLSX.utils.aoa_to_sheet([venueHeaders, ...data.venueRows])
  venueSheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, venueSheet, 'Venues')

  // SHEET 4 — Campaigns
  const campaignHeaders = [
    'Campaign',
    'Advertiser',
    'Start Date',
    'End Date',
    'Deal Type',
    'Amount Charged (ZAR)',
    'CPM Rate',
    'Gym Share %',
  ]
  const campaignSheet = XLSX.utils.aoa_to_sheet([campaignHeaders, ...data.campaignRows])
  campaignSheet['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, campaignSheet, 'Campaigns')

  XLSX.writeFile(wb, `gymgaze-revenue-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
