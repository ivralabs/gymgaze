"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Network = { id: string; name: string; slug: string; logo_url: string | null };
type Venue = { id: string; name: string; city: string | null; province: string | null; active_members: number | null; gym_brand_id: string | null };

type Props = { networks: Network[]; venues: Venue[] };

const STEPS = [
  { label: "Gym Network", icon: Building2 },
  { label: "Proposal Settings", icon: FileText },
  { label: "Select Venues", icon: MapPin },
  { label: "Review & Save", icon: Check },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NewProposalClient({ networks, venues }: Props) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Network
  const [networkId, setNetworkId] = useState("");
  const [newNetworkName, setNewNetworkName] = useState("");
  const [newNetworkSlug, setNewNetworkSlug] = useState("");
  const [newNetworkEmail, setNewNetworkEmail] = useState("");
  const [createNew, setCreateNew] = useState(false);

  // Step 2: Proposal settings
  const [title, setTitle] = useState("Strategic Media Partnership v1");
  const [partnerPct, setPartnerPct] = useState(70);
  const [gracePeriod, setGracePeriod] = useState(2);
  const [dedicatedSlots, setDedicatedSlots] = useState(1);
  const [slotSeconds, setSlotSeconds] = useState(7);
  const [sponsorshipsExcluded, setSponsorshipsExcluded] = useState(true);
  const [staticSitesIncluded, setStaticSitesIncluded] = useState(true);
  const [digitalScreensIncluded, setDigitalScreensIncluded] = useState(true);
  const [dataSharingRequired, setDataSharingRequired] = useState(true);
  const [proofOfFlightRequired, setProofOfFlightRequired] = useState(true);
  const [cpmBenchmark, setCpmBenchmark] = useState(85);
  const [flightStart, setFlightStart] = useState("");
  const [flightEnd, setFlightEnd] = useState("");

  // Step 3: Venues
  const [selectedVenueIds, setSelectedVenueIds] = useState<Set<string>>(new Set());
  const [filterBrand, setFilterBrand] = useState("");

  // Derived
  const selectedNetwork = networks.find((n) => n.id === networkId);
  const gymgazePct = 100 - partnerPct;

  // Unique brand slugs for filter
  const brandGroups = new Map<string | null, Venue[]>();
  venues.forEach((v) => {
    const key = v.gym_brand_id;
    if (!brandGroups.has(key)) brandGroups.set(key, []);
    brandGroups.get(key)!.push(v);
  });

  const filteredVenues = filterBrand
    ? venues.filter((v) => v.gym_brand_id === filterBrand)
    : venues;

  function toggleVenue(id: string) {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      filteredVenues.forEach((v) => next.add(v.id));
      return next;
    });
  }

  function clearFiltered() {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      filteredVenues.forEach((v) => next.delete(v.id));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Create network first if needed
      let finalNetworkId = networkId;
      if (createNew) {
        const netRes = await fetch("/api/gym-networks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newNetworkName,
            slug: newNetworkSlug || newNetworkName.toLowerCase().replace(/\s+/g, "-"),
            primary_contact_email: newNetworkEmail || null,
          }),
        });
        if (!netRes.ok) {
          const err = await netRes.json();
          throw new Error(err.error ?? "Failed to create network");
        }
        const netData = await netRes.json();
        finalNetworkId = netData.id;
      }

      // Create proposal
      const proposalRes = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network_id: finalNetworkId || null,
          title,
          status: "draft",
          revenue_split_partner_pct: partnerPct,
          revenue_split_gymgaze_pct: gymgazePct,
          grace_period_months: gracePeriod,
          dedicated_slots_count: dedicatedSlots,
          dedicated_slot_seconds: slotSeconds,
          sponsorships_excluded: sponsorshipsExcluded,
          static_sites_included: staticSitesIncluded,
          digital_screens_included: digitalScreensIncluded,
          data_sharing_required: dataSharingRequired,
          proof_of_flight_required: proofOfFlightRequired,
          cpm_benchmark: cpmBenchmark,
          flight_start: flightStart || null,
          flight_end: flightEnd || null,
          venue_ids: Array.from(selectedVenueIds),
        }),
      });
      if (!proposalRes.ok) {
        const err = await proposalRes.json();
        throw new Error(err.error ?? "Failed to create proposal");
      }
      const proposal = await proposalRes.json();
      showToast("Proposal created!", "success");
      setTimeout(() => router.push(`/admin/proposals/${proposal.id}`), 800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
    color: "#fff", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    color: "#888", marginBottom: 6, display: "block",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 860 }}>
      <Toast {...toast} onDismiss={hideToast} />

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Inter Tight, sans-serif", margin: "0 0 4px" }}>
          New Partnership Proposal
        </h1>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          Create a proposal for a gym network partnership.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = idx === step;
          const done = idx < step;
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? 1 : "none" }}>
              <button
                onClick={() => idx < step && setStep(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 8, border: "none",
                  background: active ? "rgba(212,255,79,0.12)" : "transparent",
                  cursor: idx < step ? "pointer" : "default",
                  color: active ? "#D4FF4F" : done ? "#88bb00" : "#555",
                  fontSize: 12, fontWeight: active ? 700 : 500,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: active ? "#D4FF4F" : done ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {done ? (
                    <Check size={12} color="#0a0a0a" strokeWidth={3} />
                  ) : (
                    <Icon size={12} color={active ? "#0a0a0a" : "#666"} strokeWidth={2.5} />
                  )}
                </div>
                {s.label}
              </button>
              {idx < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: idx < step ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)", margin: "0 4px" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "28px 32px",
      }}>

        {/* ── Step 0: Network ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Select Gym Network</div>

            <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
              <button
                onClick={() => setCreateNew(false)}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: !createNew ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.06)",
                  border: !createNew ? "1px solid rgba(212,255,79,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: !createNew ? "#D4FF4F" : "#888", cursor: "pointer",
                }}
              >Existing network</button>
              <button
                onClick={() => setCreateNew(true)}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: createNew ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.06)",
                  border: createNew ? "1px solid rgba(212,255,79,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: createNew ? "#D4FF4F" : "#888", cursor: "pointer",
                }}
              >Create new network</button>
            </div>

            {!createNew ? (
              <div>
                <label style={labelStyle}>Gym Network</label>
                <select
                  value={networkId}
                  onChange={(e) => setNetworkId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Select a network —</option>
                  {networks.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Network Name *</label>
                  <input style={inputStyle} value={newNetworkName} onChange={(e) => setNewNetworkName(e.target.value)} placeholder="e.g. Edge Fitness" />
                </div>
                <div>
                  <label style={labelStyle}>Slug (URL-safe)</label>
                  <input style={inputStyle} value={newNetworkSlug} onChange={(e) => setNewNetworkSlug(e.target.value)} placeholder="e.g. edge-fitness" />
                </div>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input style={inputStyle} type="email" value={newNetworkEmail} onChange={(e) => setNewNetworkEmail(e.target.value)} placeholder="contact@gymchain.co.za" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Proposal settings ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Proposal Settings</div>

            <div>
              <label style={labelStyle}>Proposal Title *</label>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Partner Revenue % *</label>
                <input style={inputStyle} type="number" min={1} max={99} value={partnerPct} onChange={(e) => setPartnerPct(Number(e.target.value))} />
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>GymGaze gets {gymgazePct}%</div>
              </div>
              <div>
                <label style={labelStyle}>Grace Period (months)</label>
                <input style={inputStyle} type="number" min={0} value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>CPM Benchmark (R)</label>
                <input style={inputStyle} type="number" min={1} value={cpmBenchmark} onChange={(e) => setCpmBenchmark(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Dedicated Slots</label>
                <input style={inputStyle} type="number" min={0} value={dedicatedSlots} onChange={(e) => setDedicatedSlots(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Slot Duration (sec)</label>
                <input style={inputStyle} type="number" min={1} value={slotSeconds} onChange={(e) => setSlotSeconds(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Flight Start</label>
                <input style={inputStyle} type="date" value={flightStart} onChange={(e) => setFlightStart(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Flight End</label>
                <input style={inputStyle} type="date" value={flightEnd} onChange={(e) => setFlightEnd(e.target.value)} />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Sponsorships excluded", value: sponsorshipsExcluded, set: setSponsorshipsExcluded },
                { label: "Static sites included", value: staticSitesIncluded, set: setStaticSitesIncluded },
                { label: "Digital screens included", value: digitalScreensIncluded, set: setDigitalScreensIncluded },
                { label: "Data sharing required", value: dataSharingRequired, set: setDataSharingRequired },
                { label: "Proof of flight required", value: proofOfFlightRequired, set: setProofOfFlightRequired },
              ].map(({ label, value, set }) => (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <input
                    type="checkbox" checked={value} onChange={(e) => set(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#D4FF4F", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, color: "#ccc" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Venues ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Select Venues</div>
              <span style={{ fontSize: 12, color: "#888" }}>{selectedVenueIds.size} selected</span>
            </div>

            {/* Brand filter */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#666" }}>Filter by brand:</span>
              <button
                onClick={() => setFilterBrand("")}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: filterBrand === "" ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.06)",
                  border: filterBrand === "" ? "1px solid rgba(212,255,79,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: filterBrand === "" ? "#D4FF4F" : "#888", cursor: "pointer",
                }}
              >All</button>
              {Array.from(brandGroups.keys()).filter(Boolean).map((brandId) => {
                const sample = brandGroups.get(brandId)![0];
                return (
                  <button
                    key={brandId}
                    onClick={() => setFilterBrand(brandId!)}
                    style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: filterBrand === brandId ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.06)",
                      border: filterBrand === brandId ? "1px solid rgba(212,255,79,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      color: filterBrand === brandId ? "#D4FF4F" : "#888", cursor: "pointer",
                    }}
                  >{sample.name.split(" ")[0]}&hellip;</button>
                );
              })}
              <button onClick={selectAllFiltered} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc", cursor: "pointer" }}>
                Select all
              </button>
              <button onClick={clearFiltered} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc", cursor: "pointer" }}>
                Clear
              </button>
            </div>

            {/* Venue list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
              {filteredVenues.map((v) => {
                const selected = selectedVenueIds.has(v.id);
                return (
                  <label key={v.id} style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: "10px 14px", borderRadius: 8,
                    background: selected ? "rgba(212,255,79,0.08)" : "rgba(255,255,255,0.03)",
                    border: selected ? "1px solid rgba(212,255,79,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <input
                      type="checkbox" checked={selected} onChange={() => toggleVenue(v.id)}
                      style={{ width: 15, height: 15, accentColor: "#D4FF4F", cursor: "pointer", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {[v.city, v.province].filter(Boolean).join(", ")}
                        {v.active_members ? ` · ${v.active_members.toLocaleString("en-ZA")} members` : ""}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Review & Save</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Network", value: createNew ? newNetworkName : (selectedNetwork?.name ?? "None") },
                { label: "Title", value: title },
                { label: "Revenue Split", value: `${partnerPct}% / ${gymgazePct}%` },
                { label: "CPM Benchmark", value: `R${cpmBenchmark}` },
                { label: "Grace Period", value: `${gracePeriod} months` },
                { label: "Dedicated Slot", value: `${dedicatedSlots} × ${slotSeconds}s` },
                { label: "Venues Selected", value: selectedVenueIds.size.toString() },
                { label: "Status", value: "Draft" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "10px 14px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                  display: "flex", justifyContent: "space-between", fontSize: 13,
                }}>
                  <span style={{ color: "#888" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: "#fff" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: step === 0 ? "#444" : "#ccc",
            fontSize: 13, fontWeight: 600, cursor: step === 0 ? "default" : "pointer",
          }}
        >
          <ChevronLeft size={15} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "#D4FF4F", color: "#0a0a0a",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#D4FF4F", color: "#0a0a0a",
              fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving…" : "Save Proposal"}
          </button>
        )}
      </div>
    </div>
  );
}
