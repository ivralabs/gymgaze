"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  Users, UserPlus, X, ChevronDown, Shield, Check, Lock,
  LayoutDashboard, Building2, MapPin, Megaphone, Layers,
  DollarSign, BarChart3, Image, Lightbulb, Settings,
} from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";
import {
  NAV_PAGES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, ROLE_DEFAULTS,
  resolvePermissions, type RolePreset, type NavSlug,
} from "@/lib/permissions";

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  fontSize: "14px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#D4FF4F",
};

const PAGE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  networks:  Building2,
  venues:    MapPin,
  campaigns: Megaphone,
  inventory: Layers,
  revenue:   DollarSign,
  analytics: BarChart3,
  photos:    Image,
  insights:  Lightbulb,
  settings:  Settings,
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: RolePreset;
  permissions: NavSlug[] | null;
  suspended?: boolean;
  last_login_at?: string | null;
};

const ROLE_PRESETS: RolePreset[] = ["admin", "manager", "sales", "viewer", "custom"];

// ── Edit Role Modal ──────────────────────────────────────────────────────────
function EditRoleModal({
  member,
  onClose,
  onSaved,
}: {
  member: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<RolePreset>(member.role ?? "viewer");
  const [customPerms, setCustomPerms] = useState<NavSlug[]>(
    member.permissions ?? ROLE_DEFAULTS[member.role ?? "viewer"] ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Preview: what pages will this person see?
  const preview = role === "custom" ? customPerms : resolvePermissions(role, null);

  function togglePage(slug: NavSlug) {
    setCustomPerms((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings/team/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          role,
          permissions: role === "custom" ? customPerms : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col gap-5 overflow-y-auto dark-scroll"
        style={{
          ...GLASS_CARD,
          maxWidth: 560,
          maxHeight: "90vh",
          padding: 32,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#666", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(212,255,79,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#D4FF4F" />
          </div>
          <div>
            <p style={SECTION_LABEL}>Edit Permissions</p>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginTop: 2 }}>
              {member.full_name ?? member.email}
            </h3>
          </div>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{error}</p>
        )}

        {/* Role presets */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Role Preset</p>
          <div className="flex flex-col gap-2">
            {ROLE_PRESETS.map((r) => {
              const { bg, text } = ROLE_COLORS[r];
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    // When switching to custom, pre-fill with current role's defaults
                    if (r === "custom") {
                      setCustomPerms(
                        member.permissions?.length ? member.permissions : (ROLE_DEFAULTS[member.role] ?? [])
                      );
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? text + "44" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                    style={{ border: `2px solid ${isSelected ? text : "#444"}` }}
                  >
                    {isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: text }} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: isSelected ? text : "#C8C8C8" }}>
                      {ROLE_LABELS[r]}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#777" }}>{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                  {r !== "custom" && r !== "admin" && (
                    <div className="flex gap-1 flex-wrap justify-end" style={{ maxWidth: 160 }}>
                      {ROLE_DEFAULTS[r].slice(0, 4).map((slug) => (
                        <span key={slug} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}>
                          {slug}
                        </span>
                      ))}
                      {ROLE_DEFAULTS[r].length > 4 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}>
                          +{ROLE_DEFAULTS[r].length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom page checklist — only shown when Custom is selected */}
        {role === "custom" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Page Access</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomPerms(NAV_PAGES.map((p) => p.slug))}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}
                >
                  Select all
                </button>
                <button
                  onClick={() => setCustomPerms(["dashboard"])}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV_PAGES.map(({ slug, label }) => {
                const Icon = PAGE_ICONS[slug] ?? LayoutDashboard;
                const isDashboard = slug === "dashboard";
                const isChecked = customPerms.includes(slug) || isDashboard;
                return (
                  <button
                    key={slug}
                    onClick={() => !isDashboard && togglePage(slug)}
                    disabled={isDashboard}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isChecked ? "rgba(212,255,79,0.06)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isChecked ? "rgba(212,255,79,0.2)" : "rgba(255,255,255,0.07)"}`,
                      cursor: isDashboard ? "default" : "pointer",
                      opacity: isDashboard ? 0.6 : 1,
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0"
                      style={{
                        background: isChecked ? "#D4FF4F" : "rgba(255,255,255,0.06)",
                        border: isChecked ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {isChecked && <Check size={12} color="#0A0A0A" strokeWidth={3} />}
                    </div>
                    <Icon size={14} color={isChecked ? "#D4FF4F" : "#666"} strokeWidth={2} />
                    <span className="text-xs font-medium" style={{ color: isChecked ? "#E0E0E0" : "#888" }}>
                      {label}
                    </span>
                    {isDashboard && <Lock size={11} color="#555" style={{ marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#777" }}>
            {role === "custom" ? `${customPerms.length} page${customPerms.length !== 1 ? "s" : ""} accessible` : `${preview.length} pages accessible`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {preview.map((slug) => {
              const page = NAV_PAGES.find((p) => p.slug === slug);
              return (
                <span key={slug} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}>
                  {page?.label ?? slug}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "#999", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold"
            style={{ background: "#D4FF4F", color: "#0A0A0A", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RolePreset>("manager");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const { bg, text } = ROLE_COLORS[role];

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send invite"); return; }
      onSent();
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...GLASS_CARD, padding: 32, width: 440, maxWidth: "90vw", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#666", cursor: "pointer" }}>
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(212,255,79,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserPlus size={20} color="#D4FF4F" />
          </div>
          <div>
            <p style={SECTION_LABEL}>New member</p>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginTop: 2 }}>Invite to Team</h3>
          </div>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl mb-4" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{error}</p>
        )}

        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span style={{ ...SECTION_LABEL }}>Email Address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.co.za"
              style={INPUT_STYLE}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
            />
          </label>

          <div>
            <p style={{ ...SECTION_LABEL, display: "block", marginBottom: 10 }}>Role</p>
            <div className="flex flex-col gap-2">
              {ROLE_PRESETS.filter((r) => r !== "custom").map((r) => {
                const c = ROLE_COLORS[r];
                const isSelected = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? c.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? c.text + "44" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <div className="flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0" style={{ border: `2px solid ${isSelected ? c.text : "#444"}` }}>
                      {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.text }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: isSelected ? c.text : "#C8C8C8" }}>{ROLE_LABELS[r]}</p>
                      <p className="text-xs" style={{ color: "#666" }}>{ROLE_DESCRIPTIONS[r]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#999", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button type="submit" disabled={sending} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold" style={{ background: "#D4FF4F", color: "#0A0A0A", opacity: sending ? 0.6 : 1 }}>
              {sending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TeamSection() {
  const supabase = createClient();
  const [members, setMembers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, permissions, suspended, last_login_at")
      .order("full_name");

    const withEmails: Profile[] = (profiles ?? []).map((p) => ({
      ...p,
      email: p.id === user.id ? user.email ?? "—" : "—",
      role: (p.role ?? "viewer") as RolePreset,
      permissions: p.permissions as NavSlug[] | null,
    }));

    setCurrentUser(withEmails.find((m) => m.id === user.id) ?? null);
    setMembers(withEmails);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={SECTION_LABEL}>Team &amp; Permissions</div>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 4 }}>Admin Team</h2>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none" }}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          Invite Member
        </button>
      </div>

      <div style={GLASS_CARD}>
        {loading ? (
          <div style={{ padding: 24, color: "#999", fontSize: 14 }}>Loading team…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 14 }}>
            You are the only admin. Invite someone to collaborate.
          </div>
        ) : (
          <div className="overflow-x-auto dark-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Name", "Role", "Page Access", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  const { bg, text } = ROLE_COLORS[member.role ?? "viewer"];
                  const perms = resolvePermissions(member.role, member.permissions);
                  return (
                    <tr key={member.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
                          {member.full_name ?? "—"}
                          {isSelf && <span style={{ marginLeft: 8, fontSize: 11, color: "#D4FF4F", fontWeight: 600 }}>(you)</span>}
                        </p>
                        <p style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{member.email}</p>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: bg, color: text, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
                          {ROLE_LABELS[member.role ?? "viewer"]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex flex-wrap gap-1" style={{ maxWidth: 280 }}>
                          {perms.slice(0, 5).map((slug) => {
                            const Icon = PAGE_ICONS[slug] ?? LayoutDashboard;
                            const page = NAV_PAGES.find((p) => p.slug === slug);
                            return (
                              <span key={slug} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#C8C8C8" }}>
                                <Icon size={10} strokeWidth={2} />
                                {page?.label ?? slug}
                              </span>
                            );
                          })}
                          {perms.length > 5 && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>
                              +{perms.length - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: member.suspended ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)",
                          color: member.suspended ? "#FBBF24" : "#4ADE80",
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-block",
                        }}>
                          {member.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {isSelf ? (
                          <span style={{ fontSize: 12, color: "#555" }}>—</span>
                        ) : (
                          <button
                            onClick={() => setEditingMember(member)}
                            style={{
                              fontSize: 12, padding: "6px 14px", borderRadius: 8,
                              background: "rgba(212,255,79,0.08)", color: "#D4FF4F",
                              border: "1px solid rgba(212,255,79,0.2)", cursor: "pointer", fontWeight: 600,
                            }}
                          >
                            Edit Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSent={() => { setShowInvite(false); showToast("Invite sent!", "success"); loadTeam(); }}
        />
      )}
      {editingMember && (
        <EditRoleModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => { setEditingMember(null); showToast("Permissions updated", "success"); loadTeam(); }}
        />
      )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
