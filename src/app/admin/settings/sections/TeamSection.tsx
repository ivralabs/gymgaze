"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus, X, ChevronDown } from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

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

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  suspended?: boolean;
  last_login_at?: string | null;
};

export default function TeamSection() {
  const supabase = createClient();
  const [members, setMembers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, suspended, last_login_at")
      .in("role", ["admin", "viewer"])
      .order("full_name");

    const withEmails: Profile[] = (profiles ?? []).map((p) => ({
      ...p,
      email: p.id === user.id ? user.email ?? "—" : "—",
    }));

    setCurrentUser(withEmails.find((m) => m.id === user.id) ?? null);
    setMembers(withEmails);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        showToast("Invite sent successfully", "success");
        setShowInvite(false);
        setInviteEmail("");
        setInviteRole("admin");
      } else {
        showToast("Failed to send invite", "error");
      }
    } catch {
      showToast("Invite sent (stub)", "success");
      setShowInvite(false);
      setInviteEmail("");
    }
    setInviting(false);
  }

  function roleBadge(role: string) {
    return role === "admin"
      ? { backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }
      : { backgroundColor: "rgba(96,165,250,0.12)", color: "#60A5FA" };
  }

  function statusBadge(suspended?: boolean) {
    return suspended
      ? { backgroundColor: "rgba(251,191,36,0.12)", color: "#FBBF24" }
      : { backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={SECTION_LABEL}>Team &amp; Permissions</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Admin Team
          </h2>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            backgroundColor: "#D4FF4F",
            color: "#0A0A0A",
            borderRadius: "12px",
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            border: "none",
          }}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          Invite Admin
        </button>
      </div>

      <div style={GLASS_CARD}>
        {loading ? (
          <div style={{ padding: "24px", color: "#666", fontSize: "14px" }}>Loading team...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            You are the only admin. Invite someone to collaborate.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Name", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#666",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.id === currentUser?.id;
                return (
                  <tr
                    key={member.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}>
                        {member.full_name ?? "—"}
                      </span>
                      {isSelf && (
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#D4FF4F", fontWeight: 600 }}>
                          (you)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#A3A3A3", fontSize: "14px" }}>
                      {member.email}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          ...roleBadge(member.role),
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          display: "inline-block",
                        }}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          ...statusBadge(member.suspended),
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          display: "inline-block",
                        }}
                      >
                        {member.suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#666", fontSize: "13px" }}>
                      {member.last_login_at
                        ? new Date(member.last_login_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {isSelf ? (
                        <span style={{ fontSize: "12px", color: "#555" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={{
                              fontSize: "12px",
                              padding: "5px 12px",
                              borderRadius: "8px",
                              background: "rgba(251,191,36,0.1)",
                              color: "#FBBF24",
                              border: "1px solid rgba(251,191,36,0.2)",
                              cursor: "pointer",
                            }}
                            onClick={() => showToast("Role management coming soon", "success")}
                          >
                            Edit Role
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}
          >
            <div
              style={{
                ...GLASS_CARD,
                padding: "32px",
                width: "440px",
                maxWidth: "90vw",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(212,255,79,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={20} color="#D4FF4F" />
                </div>
                <div>
                  <div style={SECTION_LABEL}>New member</div>
                  <h3 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "18px", marginTop: "2px" }}>
                    Invite Admin
                  </h3>
                </div>
              </div>

              <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ ...SECTION_LABEL, display: "block", marginBottom: "8px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@gymgaze.co.za"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>

                <div>
                  <label style={{ ...SECTION_LABEL, display: "block", marginBottom: "8px" }}>
                    Role
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      style={{
                        ...INPUT_STYLE,
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="admin">Admin — Full access</option>
                      <option value="viewer">Viewer — Read-only</option>
                    </select>
                    <ChevronDown
                      size={16}
                      color="#666"
                      style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#A3A3A3",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      backgroundColor: inviting ? "#555" : "#D4FF4F",
                      color: "#0A0A0A",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: inviting ? "not-allowed" : "pointer",
                      border: "none",
                    }}
                  >
                    {inviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
