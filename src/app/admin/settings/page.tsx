"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Shield, Users, Key } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        id: user.id,
        full_name: p?.full_name ?? null,
        email: user.email ?? "",
        role: p?.role ?? "admin",
      });

      // Fetch all admin users
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "admin")
        .order("full_name");

      const adminEmails = await Promise.all(
        (admins ?? []).map(async (a) => {
          // We can only get email for the current user via auth
          return { ...a, email: a.id === user.id ? user.email ?? "" : "—" };
        })
      );

      setTeamMembers(adminEmails);
      setLoading(false);
    }
    load();
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setPwForm({ newPassword: "", confirm: "" });
    }
    setPwSaving(false);
  }

  const inputStyle = {
    backgroundColor: "#0A0A0A",
    border: "1px solid #2A2A2A",
    color: "#FFFFFF",
    outline: "none",
    width: "100%",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: "#141414" }} />
          <div className="h-32 rounded-2xl" style={{ backgroundColor: "#141414" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Hero Panel */}
      <div
        className="relative overflow-hidden rounded-2xl mb-8"
        style={{
          background: "linear-gradient(135deg, #141414 0%, #0F0F0F 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <img
          src="/hero-object.png"
          alt=""
          className="absolute right-0 top-0 h-full w-auto opacity-50 object-cover pointer-events-none select-none"
        />
        <div className="relative z-10 p-8">
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "2.5rem",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Platform configuration and your profile</p>
        </div>
      </div>
      <div className="max-w-2xl">

      {/* Profile section */}
      <div
        className="glass-card rounded-2xl p-6 mb-5"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
          >
            <User size={16} color="#D4FF4F" strokeWidth={2} />
          </div>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Profile
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Name
            </label>
            <input
              type="text"
              value={profile?.full_name ?? ""}
              readOnly
              style={{ ...inputStyle, color: "#A3A3A3" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              readOnly
              style={{ ...inputStyle, color: "#A3A3A3" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Role
            </label>
            <div className="flex items-center gap-2">
              <div
                className="px-4 py-3 rounded-xl flex items-center gap-2"
                style={{ backgroundColor: "#0A0A0A", border: "1px solid #2A2A2A" }}
              >
                <Shield size={14} color="#D4FF4F" strokeWidth={2} />
                <span className="text-sm font-medium" style={{ color: "#D4FF4F" }}>
                  {profile?.role ?? "admin"}
                </span>
              </div>
              <span className="text-xs" style={{ color: "#909090" }}>Read-only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div
        className="glass-card rounded-2xl p-6 mb-5"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
          >
            <Key size={16} color="#D4FF4F" strokeWidth={2} />
          </div>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Change Password
          </h2>
        </div>

        {pwSuccess && (
          <div
            className="px-4 py-3 rounded-xl mb-4 text-sm"
            style={{ backgroundColor: "rgba(212,255,79,0.08)", border: "1px solid rgba(212,255,79,0.2)", color: "#D4FF4F" }}
          >
            Password updated successfully!
          </div>
        )}

        {pwError && (
          <div
            className="px-4 py-3 rounded-xl mb-4 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
          >
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              New Password
            </label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              placeholder="Min 8 characters"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#D4FF4F"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2A2A2A"; }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              required
              placeholder="Repeat password"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#D4FF4F"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2A2A2A"; }}
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: pwSaving ? "#555" : "#D4FF4F",
                color: "#0A0A0A",
                height: "44px",
              }}
            >
              {pwSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Team management */}
      <div
        className="glass-card rounded-2xl p-6"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
          >
            <Users size={16} color="#D4FF4F" strokeWidth={2} />
          </div>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Admin Team ({teamMembers.length})
          </h2>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-sm" style={{ color: "#909090" }}>No admin users found.</p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#0A0A0A", border: "1px solid #2A2A2A" }}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {member.full_name ?? "—"}
                    {member.id === profile?.id && (
                      <span className="ml-2 text-xs" style={{ color: "#D4FF4F" }}>(you)</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "#909090" }}>{member.email}</p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
