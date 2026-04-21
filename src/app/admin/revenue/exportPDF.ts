import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface RevenueExportData {
  kpis: {
    totalRevenue: string
    rentalIncome: string
    adRevenueShare: string
    momGrowth: string
    avgPerVenue: string
    unbilledVenues: string
  }
  monthlyRows: (string | number)[][]
  monthlyTotals: (string | number)[]
  venueRows: (string | number)[][]
  campaignRows: (string | number)[][]
}

export function exportRevenuePDF(data: RevenueExportData, dateRange: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const lime = [212, 255, 79] as [number, number, number]
  const dark = [10, 10, 10] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]
  const grey = [163, 163, 163] as [number, number, number]

  // PAGE 1 — Cover
  doc.setFillColor(...dark)
  doc.rect(0, 0, 297, 210, 'F')

  doc.setFillColor(...lime)
  doc.rect(0, 0, 297, 8, 'F')
  doc.rect(0, 0, 4, 210, 'F')

  doc.setTextColor(...lime)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('GYMGAZE', 20, 40)

  doc.setTextColor(...white)
  doc.setFontSize(18)
  doc.text('Revenue Report', 20, 55)

  doc.setTextColor(...grey)
  doc.setFontSize(11)
  doc.text(`Period: ${dateRange}`, 20, 68)
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    20,
    76
  )

  // KPI boxes on cover
  const kpis = data.kpis
  const kpiBoxes = [
    { label: 'Total Revenue', value: kpis.totalRevenue },
    { label: 'Rental Income', value: kpis.rentalIncome },
    { label: 'Ad Revenue Share', value: kpis.adRevenueShare },
    { label: 'Avg Per Venue', value: kpis.avgPerVenue },
  ]

  kpiBoxes.forEach((kpi, i) => {
    const x = 20 + i * 68
    const y = 110
    doc.setFillColor(30, 30, 30)
    doc.roundedRect(x, y, 62, 32, 3, 3, 'F')
    doc.setDrawColor(...lime)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, 62, 32, 3, 3, 'S')
    doc.setTextColor(...grey)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label.toUpperCase(), x + 4, y + 8)
    doc.setTextColor(...lime)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + 4, y + 22)
  })

  // Additional KPIs below
  doc.setTextColor(...grey)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`MoM Growth: ${kpis.momGrowth}`, 20, 162)
  doc.text(`Unbilled Venues: ${kpis.unbilledVenues}`, 120, 162)

  // PAGE 2 — Monthly Breakdown Table
  doc.addPage()
  doc.setFillColor(...dark)
  doc.rect(0, 0, 297, 210, 'F')
  doc.setFillColor(...lime)
  doc.rect(0, 0, 297, 4, 'F')
  doc.rect(0, 0, 4, 210, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Monthly Revenue Breakdown', 15, 20)

  autoTable(doc, {
    startY: 28,
    head: [['Month', 'Rental (ZAR)', 'Ad Revenue (ZAR)', 'Total (ZAR)', 'Venues Billed']],
    body: data.monthlyRows,
    styles: {
      fillColor: [20, 20, 20],
      textColor: [255, 255, 255],
      fontSize: 9,
      lineColor: [50, 50, 50],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: lime,
      textColor: dark,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [25, 25, 25] },
    footStyles: { fillColor: [30, 30, 30], textColor: lime as [number, number, number], fontStyle: 'bold' },
    foot: [data.monthlyTotals],
    margin: { left: 15, right: 15 },
  })

  // PAGE 3 — Venue League Table
  doc.addPage()
  doc.setFillColor(...dark)
  doc.rect(0, 0, 297, 210, 'F')
  doc.setFillColor(...lime)
  doc.rect(0, 0, 297, 4, 'F')
  doc.rect(0, 0, 4, 210, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Venue Revenue League Table', 15, 20)

  autoTable(doc, {
    startY: 28,
    head: [['Rank', 'Venue', 'Network', 'City', 'MTD Revenue', 'Total Revenue']],
    body: data.venueRows,
    styles: {
      fillColor: [20, 20, 20],
      textColor: [255, 255, 255],
      fontSize: 9,
      lineColor: [50, 50, 50],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: lime, textColor: dark, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [25, 25, 25] },
    margin: { left: 15, right: 15 },
  })

  // PAGE 4 — Campaigns
  if (data.campaignRows.length > 0) {
    doc.addPage()
    doc.setFillColor(...dark)
    doc.rect(0, 0, 297, 210, 'F')
    doc.setFillColor(...lime)
    doc.rect(0, 0, 297, 4, 'F')
    doc.rect(0, 0, 4, 210, 'F')

    doc.setTextColor(...white)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Campaign Summary', 15, 20)

    autoTable(doc, {
      startY: 28,
      head: [['Campaign', 'Advertiser', 'Start', 'End', 'Deal Type', 'Amount (ZAR)']],
      body: data.campaignRows.map((r) => r.slice(0, 6)),
      styles: {
        fillColor: [20, 20, 20],
        textColor: [255, 255, 255],
        fontSize: 9,
        lineColor: [50, 50, 50],
        lineWidth: 0.1,
      },
      headStyles: { fillColor: lime, textColor: dark, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [25, 25, 25] },
      margin: { left: 15, right: 15 },
    })
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(...grey)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('GymGaze  |  Confidential', 15, 205)
    doc.text(`Page ${i} of ${pageCount}`, 270, 205)
    doc.setDrawColor(...lime)
    doc.setLineWidth(0.3)
    doc.line(15, 202, 282, 202)
  }

  doc.save(`gymgaze-revenue-${new Date().toISOString().slice(0, 10)}.pdf`)
}
