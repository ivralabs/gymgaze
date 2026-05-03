"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Archive, Trash2, X, AlertTriangle } from "lucide-react";

interface Props {
  networkId: string;
  networkName: string;
  isActive: boolean;
}

type Dialog = "archive" | "delete" | null;

export default function NetworkActionsButton({ networkId, networkName, isActive }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog(d: Dialog) {
    setMenuOpen(false);
    setDialog(d);
    setError(null);
  }

  async function handleArchive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/networks/${networkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to archive network");
      }
      setDialog(null);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/networks/${networkId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete network");
      }
      setDialog(null);
      router.push("/admin/networks");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };

  const modalStyle: React.CSSProperties = {
    background: "#111",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: "28px 28px 24px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    zIndex: 51,
  };

  return (
    <div className="relative">
      {/* Trigger — three-dot menu */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-150"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#A3A3A3",
        }}
        aria-label="Network actions"
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-40 rounded-xl overflow-hidden"
            style={{
              width: "200px",
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {/* Archive — only show if currently active */}
            {isActive && (
              <button
                onClick={() => openDialog("archive")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150"
                style={{ color: "#F59E0B" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Archive size={15} strokeWidth={2} />
                Archive Network
              </button>
            )}

            {/* Unarchive — show if already inactive */}
            {!isActive && (
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  setLoading(true);
                  await fetch(`/api/networks/${networkId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_active: true }),
                  });
                  setLoading(false);
                  window.location.reload();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150"
                style={{ color: "#D4FF4F" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,255,79,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Archive size={15} strokeWidth={2} />
                Unarchive Network
              </button>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

            <button
              onClick={() => openDialog("delete")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150"
              style={{ color: "#EF4444" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Trash2 size={15} strokeWidth={2} />
              Delete Network
            </button>
          </div>
        </>
      )}

      {/* ── Archive confirmation dialog ── */}
      {dialog === "archive" && (
        <div style={overlayStyle} onClick={() => !loading && setDialog(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDialog(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#666" }}
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(245,158,11,0.12)" }}>
                <Archive size={20} color="#F59E0B" strokeWidth={2} />
              </div>
              <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
                Archive Network
              </h2>
            </div>

            <p style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              Are you sure you want to archive <strong style={{ color: "#fff" }}>{networkName}</strong>?
            </p>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              The network will be marked as inactive. All venues and data are preserved and the network can be unarchived at any time.
            </p>

            {error && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDialog(null)}
                disabled={loading}
                style={{ padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", color: "#A3A3A3", background: "transparent", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={loading}
                style={{ padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", backgroundColor: loading ? "#555" : "#F59E0B", color: "#0A0A0A", cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter Tight, sans-serif" }}
              >
                {loading ? "Archiving..." : "Archive Network"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      {dialog === "delete" && (
        <div style={overlayStyle} onClick={() => !loading && setDialog(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDialog(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#666" }}
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}>
                <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />
              </div>
              <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
                Delete Network
              </h2>
            </div>

            <p style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              Are you sure you want to permanently delete <strong style={{ color: "#fff" }}>{networkName}</strong>?
            </p>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              This action <strong style={{ color: "#EF4444" }}>cannot be undone</strong>. The network record will be removed. All linked venues will be unlinked but their data (photos, revenue, contracts) will be preserved.
            </p>

            <div
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={14} color="#EF4444" strokeWidth={2} />
              <span style={{ fontSize: 12, color: "#EF4444" }}>Consider archiving instead — it&apos;s reversible.</span>
            </div>

            {error && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDialog(null)}
                disabled={loading}
                style={{ padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", color: "#A3A3A3", background: "transparent", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{ padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", backgroundColor: loading ? "#555" : "#EF4444", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter Tight, sans-serif" }}
              >
                {loading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
