"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Lock } from "lucide-react";
import { useRole } from "@/lib/useRole";

interface PricingTier {
  id: string;
  tier_key: string;
  label: string;
  cpm_zar: number;
  min_spend: number;
  duration_sec: number;
  description: string | null;
  color: string;
  bg: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

type EditState = Record<string, { cpm_zar: string; min_spend: string; duration_sec: string; label: string; description: string }>;

export default function PricingSection() {
  const { role } = useRole();
  const isAdmin = role === "admin";

  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<EditState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pricing-tiers")
      .then((r) => r.json())
      .then((data: PricingTier[]) => {
        setTiers(data);
        // Init edit state from DB values
        const init: EditState = {};
        for (const t of data) {
          init[t.id] = {
            cpm_zar: String(t.cpm_zar),
            min_spend: String(t.min_spend),
            duration_sec: String(t.duration_sec),
            label: t.label,
            description: t.description ?? "",
          };
        }
        setEdits(init);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(id: string, field: keyof EditState[string], value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSave(tier: PricingTier) {
    setSaving(tier.id);
    setError(null);
    const e = edits[tier.id];
    const body = {
      label: e.label,
      cpm_zar: parseInt(e.cpm_zar) || 0,
      min_spend: parseInt(e.min_spend) || 0,
      duration_sec: parseInt(e.duration_sec) || 7,
      description: e.description || null,
    };
    try {
      const res = await fetch(`/api/pricing-tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      const updated: PricingTier = await res.json();
      setTiers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSaved(tier.id);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  function isDirty(tier: PricingTier) {
    const e = edits[tier.id];
    if (!e) return false;
    return (
      e.label !== tier.label ||
      parseInt(e.cpm_zar) !== tier.cpm_zar ||
      parseInt(e.min_spend) !== tier.min_spend ||
      parseInt(e.duration_sec) !== tier.duration_sec ||
      (e.description || null) !== (tier.description || null)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} color="#D4FF4F" className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginBottom: 4 }}>
          CPM Pricing
        </h2>
        <p style={{ color: "#666", fontSize: 13 }}>
          Configure CPM rates, minimum spend and slot durations for each ad tier.
          {!isAdmin && (
            <span className="inline-flex items-center gap-1 ml-2" style={{ color: "#888" }}>
              <Lock size={12} /> View only — admin access required to edit
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {tiers.map((tier) => {
          const e = edits[tier.id];
          if (!e) return null;
          const dirty = isDirty(tier);
          const isSaving = saving === tier.id;
          const wasSaved = saved === tier.id;

          return (
            <div
              key={tier.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Tier header */}
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: tier.bg }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tier.color }} />
                <span className="text-sm font-semibold" style={{ color: tier.color, fontFamily: "Inter Tight, sans-serif" }}>
                  {tier.label}
                </span>
                <span className="text-xs ml-auto" style={{ color: "#555" }}>
                  {tier.tier_key}
                </span>
              </div>

              {/* Fields */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Label */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Display Name</label>
                  <input
                    type="text"
                    value={e.label}
                    onChange={(ev) => handleChange(tier.id, "label", ev.target.value)}
                    disabled={!isAdmin}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{
                      background: isAdmin ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: isAdmin ? "#fff" : "#666",
                      outline: "none",
                    }}
                  />
                </div>

                {/* CPM */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>CPM (ZAR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#555" }}>R</span>
                    <input
                      type="number"
                      min={1}
                      value={e.cpm_zar}
                      onChange={(ev) => handleChange(tier.id, "cpm_zar", ev.target.value)}
                      disabled={!isAdmin}
                      className="w-full rounded-xl pl-7 pr-3 py-2 text-sm tabular-nums"
                      style={{
                        background: isAdmin ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: isAdmin ? "#fff" : "#666",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Min spend */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Min Spend (ZAR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#555" }}>R</span>
                    <input
                      type="number"
                      min={0}
                      value={e.min_spend}
                      onChange={(ev) => handleChange(tier.id, "min_spend", ev.target.value)}
                      disabled={!isAdmin}
                      className="w-full rounded-xl pl-7 pr-3 py-2 text-sm tabular-nums"
                      style={{
                        background: isAdmin ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: isAdmin ? "#fff" : "#666",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Slot Duration (sec)</label>
                  <input
                    type="number"
                    min={1}
                    value={e.duration_sec}
                    onChange={(ev) => handleChange(tier.id, "duration_sec", ev.target.value)}
                    disabled={!isAdmin}
                    className="w-full rounded-xl px-3 py-2 text-sm tabular-nums"
                    style={{
                      background: isAdmin ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: isAdmin ? "#fff" : "#666",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Description</label>
                  <input
                    type="text"
                    value={e.description}
                    onChange={(ev) => handleChange(tier.id, "description", ev.target.value)}
                    disabled={!isAdmin}
                    placeholder="Short description for sales team..."
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{
                      background: isAdmin ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: isAdmin ? "#fff" : "#666",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Save button */}
                {isAdmin && (
                  <div className="flex items-end">
                    <button
                      onClick={() => handleSave(tier)}
                      disabled={!dirty || isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: wasSaved
                          ? "rgba(110,231,183,0.15)"
                          : dirty
                          ? "#D4FF4F"
                          : "rgba(255,255,255,0.04)",
                        color: wasSaved ? "#6EE7B7" : dirty ? "#0A0A0A" : "#444",
                        cursor: dirty && !isSaving ? "pointer" : "not-allowed",
                        border: wasSaved ? "1px solid rgba(110,231,183,0.2)" : "none",
                      }}
                    >
                      {isSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : wasSaved ? (
                        "Saved ✓"
                      ) : (
                        <>
                          <Save size={14} strokeWidth={2} />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs" style={{ color: "#444" }}>
        Changes apply immediately to the Rate Card and CPM Calculator.
      </p>
    </div>
  );
}
