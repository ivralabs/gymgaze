'use client'

import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Monitor,
  ChevronDown,
} from 'lucide-react'
import { generateProofPDF, type Campaign, type Photo, type Venue } from './proofPDF'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Screen {
  id: string
  venue_id: string
  label: string
  is_active: boolean
  venues?: { id: string; name: string; city: string; gym_brands?: { name: string } | null } | null
}

interface PhotosClientProps {
  photos: Photo[]
  venues: Venue[]
  screens: Screen[]
  campaigns: Campaign[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMonth(date: Date) {
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(iso: string | null) {
  if (!iso) return 'No uploads'
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function venueStatus(totalCount: number, approvedCount: number): 'complete' | 'partial' | 'missing' {
  if (totalCount === 0) return 'missing'
  if (approvedCount === totalCount) return 'complete'
  return 'partial'
}

const STATUS_COLOR = {
  complete: '#D4FF4F',
  partial: '#F59E0B',
  missing: '#EF4444',
}

const STATUS_LABEL = {
  complete: 'Complete',
  partial: 'Partial',
  missing: 'Missing',
}

// ─── Photo Detail Modal ───────────────────────────────────────────────────────

interface PhotoModalProps {
  venue: Venue
  month: string // "YYYY-MM"
  photos: Photo[]
  onClose: () => void
  onPhotosChange: (updater: (prev: Photo[]) => Photo[]) => void
}

function PhotoModal({ venue, month, photos, onClose, onPhotosChange }: PhotoModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  })

  async function handleApprove(id: string) {
    setLoading(id)
    const res = await fetch(`/api/photos/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      onPhotosChange((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
      )
    }
    setLoading(null)
  }

  async function handleReject(id: string) {
    setLoading(id)
    const res = await fetch(`/api/photos/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Rejected by admin' }),
    })
    if (res.ok) {
      onPhotosChange((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
      )
    }
    setLoading(null)
  }

  async function handleApproveAll() {
    setBulkLoading(true)
    const pending = photos.filter((p) => p.status === 'pending')
    await Promise.all(
      pending.map((p) =>
        fetch(`/api/photos/${p.id}/approve`, { method: 'POST' })
      )
    )
    onPhotosChange((prev) =>
      prev.map((p) =>
        photos.some((vp) => vp.id === p.id && p.status === 'pending')
          ? { ...p, status: 'approved' }
          : p
      )
    )
    setBulkLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(15,15,15,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2
              className="text-white font-bold"
              style={{ fontFamily: 'Inter Tight, sans-serif', fontSize: '1.1rem' }}
            >
              {venue.name} — {monthLabel}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#909090' }}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} this month
            </p>
          </div>
          <div className="flex items-center gap-3">
            {photos.some((p) => p.status === 'pending') && (
              <button
                onClick={handleApproveAll}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(212,255,79,0.12)',
                  color: '#D4FF4F',
                  border: '1px solid rgba(212,255,79,0.25)',
                  opacity: bulkLoading ? 0.6 : 1,
                }}
              >
                <CheckCircle2 size={14} strokeWidth={2} />
                Approve All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl"
              style={{ color: '#909090', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Photo grid */}
        <div className="p-6 overflow-y-auto flex-1 dark-scroll">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ImageIcon size={40} strokeWidth={1.5} style={{ color: '#444' }} className="mb-4" />
              <p className="text-white font-medium">No photos submitted for this venue this month</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => {
                const isLoading = loading === photo.id
                return (
                  <div
                    key={photo.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video flex items-center justify-center overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {photo.signedUrl ? (
                        <img
                          src={photo.signedUrl}
                          alt="Venue photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={24} strokeWidth={1.5} style={{ color: '#444' }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              photo.status === 'approved'
                                ? 'rgba(212,255,79,0.12)'
                                : photo.status === 'rejected'
                                ? 'rgba(239,68,68,0.12)'
                                : 'rgba(163,163,163,0.12)',
                            color:
                              photo.status === 'approved'
                                ? '#D4FF4F'
                                : photo.status === 'rejected'
                                ? '#EF4444'
                                : '#A3A3A3',
                          }}
                        >
                          {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: '#909090' }}>
                        {formatDate(photo.created_at)}
                      </p>
                      {photo.status !== 'approved' && photo.status !== 'rejected' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(photo.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(212,255,79,0.1)',
                              color: '#D4FF4F',
                              border: '1px solid rgba(212,255,79,0.2)',
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            <CheckCircle2 size={12} strokeWidth={2} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(photo.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(239,68,68,0.1)',
                              color: '#EF4444',
                              border: '1px solid rgba(239,68,68,0.2)',
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            <XCircle size={12} strokeWidth={2} />
                            Reject
                          </button>
                        </div>
                      )}
                      {(photo.status === 'approved' || photo.status === 'rejected') && (
                        <button
                          onClick={() => (photo.status === 'approved' ? handleReject(photo.id) : handleApprove(photo.id))}
                          disabled={isLoading}
                          className="w-full py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#909090',
                            border: '1px solid rgba(255,255,255,0.08)',
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        >
                          {photo.status === 'approved' ? 'Undo Approve' : 'Undo Reject'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhotosClient({ photos: initialPhotos, venues, screens, campaigns }: PhotosClientProps) {
  const [activeTab] = useState<'flighting'>('flighting')
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  // Month picker state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Filters
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  // PDF generator popover
  const [showPDFPopover, setShowPDFPopover] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')

  const monthKey = toMonthKey(currentMonth)

  // All networks for dropdown
  const networks = useMemo(() => {
    const seen = new Set<string>()
    const list: { id: string; name: string }[] = []
    for (const v of venues) {
      if (v.gym_brand_id && v.gym_brands?.name && !seen.has(v.gym_brand_id)) {
        seen.add(v.gym_brand_id)
        list.push({ id: v.gym_brand_id, name: v.gym_brands.name })
      }
    }
    return list
  }, [venues])

  // Venue cards data
  const venueCards = useMemo(() => {
    return venues
      .filter((venue) => {
        if (networkFilter !== 'all' && venue.gym_brand_id !== networkFilter) return false
        const venuePhotos = photos.filter(
          (p) => p.venue_id === venue.id && p.month?.slice(0, 7) === monthKey
        )
        const approvedCount = venuePhotos.filter((p) => p.status === 'approved').length
        const totalCount = venuePhotos.length
        const status = venueStatus(totalCount, approvedCount)
        if (statusFilter !== 'all' && status !== statusFilter) return false
        return true
      })
      .map((venue) => {
        const venuePhotos = photos.filter(
          (p) => p.venue_id === venue.id && p.month?.slice(0, 7) === monthKey
        )
        const approvedCount = venuePhotos.filter((p) => p.status === 'approved').length
        const totalCount = venuePhotos.length
        const status = venueStatus(totalCount, approvedCount)
        const lastUpload = venuePhotos
          .map((p) => p.created_at)
          .filter(Boolean)
          .sort()
          .reverse()[0] ?? null
        return { venue, venuePhotos, approvedCount, totalCount, status, lastUpload }
      })
  }, [venues, photos, monthKey, networkFilter, statusFilter])

  function prevMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  function handleGeneratePDF() {
    const campaign = campaigns.find((c) => c.id === selectedCampaignId)
    if (!campaign) return
    generateProofPDF(campaign, photos, venues)
    setShowPDFPopover(false)
  }

  // Screen inventory stats
  const totalScreens = screens.length
  const activeScreens = screens.filter((s) => s.is_active).length
  const offlineScreens = totalScreens - activeScreens

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8">
          <h1
            style={{
              fontFamily: 'Inter Tight, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            Proof Of Flight
          </h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Monthly flighting board across all venues
          </p>
        </div>
      </div>

      {/* Tab bar removed — Screen Inventory moved to /admin/inventory */}
      <div style={{ display: 'none' }}>
        {[
          { key: 'flighting', label: 'Monthly Flighting Board' },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: isActive ? '#D4FF4F' : '#909090',
                background: isActive ? 'rgba(212,255,79,0.08)' : 'transparent',
                borderBottom: isActive ? '2px solid #D4FF4F' : '2px solid transparent',
                fontFamily: 'Inter Tight, sans-serif',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: Monthly Flighting Board ─────────────────────────────── */}
      {activeTab === 'flighting' && (
        <div>
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Month picker */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#909090' }}
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <span
                className="text-sm font-semibold text-white px-2"
                style={{ fontFamily: 'Inter Tight, sans-serif', minWidth: '110px', textAlign: 'center' }}
              >
                {formatMonth(currentMonth)}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#909090' }}
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Network filter */}
            <div className="relative">
              <select
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="glass-input pl-3 pr-8 py-2 text-sm appearance-none cursor-pointer"
                style={{ minWidth: '150px' }}
              >
                <option value="all">All Networks</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#909090' }}
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input pl-3 pr-8 py-2 text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="complete">Complete</option>
                <option value="partial">Partial</option>
                <option value="missing">Missing</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#909090' }}
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Generate PDF button */}
            <div className="relative">
              <button
                onClick={() => setShowPDFPopover((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  color: '#D4FF4F',
                  border: '1px solid rgba(212,255,79,0.4)',
                  background: 'rgba(212,255,79,0.06)',
                }}
              >
                <FileText size={16} strokeWidth={2} />
                Generate Proof of Flighting
              </button>

              {/* PDF Popover */}
              {showPDFPopover && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl p-4 z-40"
                  style={{
                    background: 'rgba(20,20,20,0.98)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '260px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  <p
                    className="text-sm font-semibold text-white mb-3"
                    style={{ fontFamily: 'Inter Tight, sans-serif' }}
                  >
                    Select Campaign
                  </p>
                  <div className="relative mb-3">
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="glass-input w-full pl-3 pr-8 py-2 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Choose campaign...</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#909090' }}
                    />
                  </div>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={!selectedCampaignId}
                    className="w-full py-2 rounded-xl text-sm font-medium"
                    style={{
                      backgroundColor: selectedCampaignId ? '#D4FF4F' : 'rgba(212,255,79,0.2)',
                      color: selectedCampaignId ? '#0A0A0A' : '#555',
                      fontFamily: 'Inter Tight, sans-serif',
                      cursor: selectedCampaignId ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Generate PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Venue grid */}
          {venueCards.length === 0 ? (
            <div
              className="glass-card flex flex-col items-center justify-center py-20"
              style={{ borderRadius: 16 }}
            >
              <ImageIcon size={40} strokeWidth={1.5} style={{ color: '#444' }} className="mb-4" />
              <p className="text-white font-medium">No venues found</p>
              <p className="text-sm mt-1" style={{ color: '#909090' }}>
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {venueCards.map(({ venue, venuePhotos, approvedCount, totalCount, status, lastUpload }) => {
                const statusColor = STATUS_COLOR[status]
                const networkName = venue.gym_brands?.name ?? null
                const progressPct = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0

                return (
                  <div
                    key={venue.id}
                    className="glass-card p-5 flex flex-col gap-4 cursor-pointer hover:border-white/15 transition-all duration-200"
                    style={{
                      borderRadius: 16,
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLDivElement).style.background =
                        'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLDivElement).style.background =
                        'rgba(255,255,255,0.04)'
                    }}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Status dot */}
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            flexShrink: 0,
                          }}
                        />
                        {/* Network badge */}
                        {networkName && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.07)',
                              color: '#A3A3A3',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {networkName}
                          </span>
                        )}
                      </div>
                      {/* Status badge */}
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor:
                            status === 'complete'
                              ? 'rgba(212,255,79,0.12)'
                              : status === 'partial'
                              ? 'rgba(245,158,11,0.12)'
                              : 'rgba(239,68,68,0.12)',
                          color: statusColor,
                          border: `1px solid ${statusColor}33`,
                        }}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>

                    {/* Venue name + city */}
                    <div>
                      <p
                        className="text-white font-bold leading-tight"
                        style={{ fontFamily: 'Inter Tight, sans-serif', fontSize: '1rem' }}
                      >
                        {venue.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#909090' }}>
                        {venue.city ?? '—'}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%`, backgroundColor: '#D4FF4F' }}
                        />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: '#A3A3A3' }}>
                        {approvedCount} of {totalCount} photo{totalCount !== 1 ? 's' : ''} approved
                      </p>
                    </div>

                    {/* Last upload + View button */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: '#666' }}>
                        Last upload:{' '}
                        <span style={{ color: '#A3A3A3' }}>
                          {lastUpload ? formatDate(lastUpload) : 'No uploads'}
                        </span>
                      </p>
                      <button
                        onClick={() => setSelectedVenue(venue)}
                        className="text-xs font-medium"
                        style={{ color: '#D4FF4F' }}
                      >
                        View Photos →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}


      {/* Photo Detail Modal */}
      {selectedVenue && (
        <PhotoModal
          venue={selectedVenue}
          month={monthKey}
          photos={photos.filter(
            (p) => p.venue_id === selectedVenue.id && p.month?.slice(0, 7) === monthKey
          )}
          onClose={() => setSelectedVenue(null)}
          onPhotosChange={setPhotos}
        />
      )}

      {/* Click outside to close PDF popover */}
      {showPDFPopover && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowPDFPopover(false)}
        />
      )}
    </div>
  )
}
