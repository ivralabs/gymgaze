import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface Campaign {
  id: string
  name: string
  advertiser: string | null
  start_date: string | null
  end_date: string | null
  campaign_venues?: { venue_id: string }[]
}

export interface Photo {
  id: string
  venue_id: string
  status: string
  month: string | null
  created_at: string | null
  storage_path: string
  signedUrl?: string | null
  venues?: { id: string; name: string; city: string; gym_brand_id: string | null; gym_brands?: { name: string } | null } | null
}

export interface Venue {
  id: string
  name: string
  city: string | null
  status: string
  gym_brand_id: string | null
  gym_brands?: { name: string } | null
}

export function generateProofPDF(campaign: Campaign, photos: Photo[], venues: Venue[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const lime = [212, 255, 79] as [number, number, number]
  const dark = [10, 10, 10] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]
  const grey = [120, 120, 120] as [number, number, number]

  // Cover page
  doc.setFillColor(...dark)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(...lime)
  doc.rect(0, 0, 210, 6, 'F')
  doc.rect(0, 0, 4, 297, 'F')

  doc.setTextColor(...lime)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('GYMGAZE', 15, 35)

  doc.setTextColor(...white)
  doc.setFontSize(16)
  doc.text('Proof of Flighting', 15, 48)

  doc.setTextColor(...grey)
  doc.setFontSize(10)
  doc.text(`Campaign: ${campaign.name}`, 15, 62)
  doc.text(`Advertiser: ${campaign.advertiser || '—'}`, 15, 70)
  doc.text(`Flight Period: ${campaign.start_date ?? '—'} to ${campaign.end_date ?? '—'}`, 15, 78)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, 15, 86)

  // Filter photos for campaign venues
  const campaignVenueIds = campaign.campaign_venues?.map((cv) => cv.venue_id) ?? []
  const relevantPhotos = photos.filter(
    (p) => campaignVenueIds.includes(p.venue_id) && p.status === 'approved'
  )

  // Group by venue
  const byVenue: Record<string, typeof relevantPhotos> = {}
  for (const photo of relevantPhotos) {
    if (!byVenue[photo.venue_id]) byVenue[photo.venue_id] = []
    byVenue[photo.venue_id].push(photo)
  }

  // Summary table page
  doc.addPage()
  doc.setFillColor(...dark)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(...lime)
  doc.rect(0, 0, 210, 6, 'F')
  doc.rect(0, 0, 4, 297, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Flighting Summary', 15, 22)

  const rows = Object.entries(byVenue).map(([venueId, vPhotos]) => {
    const venue = venues.find((v) => v.id === venueId)
    return [
      venue?.name ?? venueId,
      venue?.city ?? '—',
      vPhotos.length.toString(),
      vPhotos[vPhotos.length - 1]?.created_at?.slice(0, 10) ?? '—',
    ]
  })

  autoTable(doc, {
    startY: 28,
    head: [['Venue', 'City', 'Photos Submitted', 'Last Upload']],
    body: rows.length > 0 ? rows : [['No approved photos found', '', '', '']],
    styles: {
      fillColor: [20, 20, 20],
      textColor: [255, 255, 255],
      fontSize: 9,
      lineColor: [50, 50, 50],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: lime, textColor: dark, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [25, 25, 25] },
    margin: { left: 15, right: 15 },
  })

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(7)
    doc.text('GymGaze  |  Confidential  |  Proof of Flighting', 15, 292)
    doc.text(`Page ${i} of ${pageCount}`, 185, 292)
    doc.setDrawColor(...lime)
    doc.setLineWidth(0.2)
    doc.line(15, 289, 195, 289)
  }

  doc.save(
    `gymgaze-proof-${campaign.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  )
}
