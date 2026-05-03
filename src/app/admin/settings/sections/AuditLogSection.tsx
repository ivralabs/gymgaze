"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Download, ChevronLeft, ChevronRight } from "lucide-react";

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
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#FFFFFF",
  outline: "none",
  fontSize: "13px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#D4FF4F",
};

const ACTION_TYPES = [
  "auth.login",
  "venue.created",
  "venue.updated",
  "campaign.created",
  "photo.approved",
  "photo.rejected",
  "revenue.entry_added",
  "settings.changed",
  "team.invited",
  "team.suspended",
  "team.removed",
];

type AuditRow = {
  id: string;
  action: string;
  record_type: string | null;
  record_id: string | null;
  record_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_id: string | null;
  profiles?: { full_name: string | null; email: string | null } | null;
};

export default function AuditLogSection() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Applied filters (only update on "Apply" click)
  const [applied, setApplied] = useState({ user: "", action: "", from: "", to: "" });

  const fetchLogs = useCallback(
    async (p: number, filters: typeof applied) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        if (filters.user) params.set("user", filters.user);
        if (filters.action) params.set("action", filters.action);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);

        const res = await fetch(`/api/settings/audit-log?${params.toString()}`);
        const data = await res.json();
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setRows([]);
        setTotal(0);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchLogs(page, applied);
  }, [page, applied, fetchLogs]);

  function handleApply() {
    setPage(1);
    setApplied({ user: filterUser, action: filterAction, from: filterFrom, to: filterTo });
  }

  function exportCsv() {
    const csv = "Timestamp,User,Action,Record Type,Record\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            <ClipboardList size={20} color="#D4FF4F" />
          </div>
          <div>
            <div style={SECTION_LABEL}>Activity</div>
            <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
              Audit Log
            </h2>
          </div>
        </div>
        <button
          onClick={exportCsv}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#C8C8C8",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          ...GLASS_CARD,
          padding: "16px 20px",
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "160px" }}>
          <label style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>Action</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ ...INPUT_STYLE, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
          >
            <option value="">All actions</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
          <label style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>From</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
          <label style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>To</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        <button
          onClick={handleApply}
          style={{
            backgroundColor: "#D4FF4F",
            color: "#0A0A0A",
            borderRadius: "10px",
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            border: "none",
            height: "38px",
          }}
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div style={GLASS_CARD}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#999", fontSize: "14px" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <ClipboardList size={32} color="#444" style={{ marginBottom: "12px" }} />
            <div style={{ color: "#999", fontSize: "14px" }}>No actions logged yet.</div>
            <div style={{ color: "#777", fontSize: "12px", marginTop: "4px" }}>
              Actions will appear here as the platform is used.
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Timestamp", "User", "Action", "Record Type", "Record"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#8A8A8A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td style={{ padding: "12px 16px", color: "#999", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 500 }}>
                          {row.profiles?.full_name ?? "—"}
                        </div>
                        <div style={{ color: "#8A8A8A", fontSize: "12px" }}>{row.profiles?.email ?? "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            backgroundColor: "rgba(212,255,79,0.08)",
                            color: "#D4FF4F",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.action}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#C8C8C8", fontSize: "13px" }}>
                        {row.record_type ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#C8C8C8", fontSize: "13px" }}>
                        {row.record_name ?? row.record_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ color: "#999", fontSize: "13px" }}>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: page === 1 ? "#444" : "#A3A3A3",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: page === totalPages ? "#444" : "#A3A3A3",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
