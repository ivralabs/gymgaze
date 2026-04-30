"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CloudUpload, CheckCircle2, X, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AreaTag = "gym_floor" | "reception" | "changerooms" | "equipment" | "outdoor" | "other";

const AREA_OPTIONS: { value: AreaTag; label: string }[] = [
  { value: "gym_floor",    label: "Gym Floor" },
  { value: "reception",    label: "Reception" },
  { value: "changerooms",  label: "Changerooms" },
  { value: "equipment",    label: "Equipment Area" },
  { value: "outdoor",      label: "Outdoor" },
  { value: "other",        label: "Other" },
];

type FileItem = {
  file: File;
  area: AreaTag;
  progress: number; // 0–100
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPhotoPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...arr.map((file) => ({ file, area: "other" as AreaTag, progress: 0, status: "idle" as const })),
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function setArea(idx: number, area: AreaTag) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, area } : item)));
  }

  function setItemState(idx: number, patch: Partial<FileItem>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMonth || items.length === 0) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("venue_id")
        .eq("id", user.id)
        .single();

      if (!profile?.venue_id) throw new Error("No venue assigned to your account");

      let allOk = true;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setItemState(i, { status: "uploading", progress: 10 });

        const path = `${profile.venue_id}/${selectedMonth}/${Date.now()}-${item.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("venue-photos")
          .upload(path, item.file, { upsert: false });

        if (uploadError) {
          setItemState(i, { status: "error", error: uploadError.message, progress: 0 });
          allOk = false;
          continue;
        }

        setItemState(i, { progress: 70 });

        const { error: dbError } = await supabase.from("venue_photos").insert({
          venue_id: profile.venue_id,
          storage_path: path,
          uploaded_by: user.id,
          month: `${selectedMonth}-01`,
          status: "pending",
          area_tag: item.area,
          file_name: item.file.name,
          file_size_bytes: item.file.size,
        });

        if (dbError) {
          setItemState(i, { status: "error", error: dbError.message, progress: 0 });
          allOk = false;
          continue;
        }

        setItemState(i, { status: "done", progress: 100 });
      }

      if (allOk) {
        setTimeout(() => setSuccess(true), 400);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(212,255,79,0.1)" }}
        >
          <CheckCircle2 size={32} color="#D4FF4F" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Inter Tight, sans-serif" }}>
          Photos submitted!
        </h2>
        <p className="text-sm mb-6" style={{ color: "#909090" }}>
          Your photos are pending approval by the GymGaze team.
        </p>
        <Link
          href="/portal/manager"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const allDone = items.length > 0 && items.every((i) => i.status === "done");
  const hasErrors = items.some((i) => i.status === "error");

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="rounded-2xl mb-6 p-6 flex items-center gap-4" style={cardStyle}>
        <Link
          href="/portal/manager"
          className="p-2 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#fff", letterSpacing: "-0.02em" }}>
            Upload Photos
          </h1>
          <p style={{ color: "#666", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Submit monthly proof-of-display photos — no size limit
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        {/* Month selector */}
        <div className="rounded-2xl p-6 mb-5" style={cardStyle}>
          <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
            Select Month *
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={inputStyle}
          >
            <option value="">Choose month...</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div className="rounded-2xl p-6 mb-5" style={cardStyle}>
          <div
            className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-150"
            style={{
              border: `2px dashed ${dragOver ? "#C8F438" : "#D4FF4F"}`,
              backgroundColor: dragOver ? "rgba(212,255,79,0.08)" : "rgba(212,255,79,0.04)",
              padding: "40px 24px",
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            <CloudUpload size={44} color="#D4FF4F" strokeWidth={1.5} className="mb-3" />
            <p className="text-base font-medium text-center text-white">Drop photos here or tap to browse</p>
            <p className="text-sm mt-1 text-center" style={{ color: "#909090" }}>
              JPG, PNG, HEIC &mdash; no size limit
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list with area tags + progress */}
          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{item.file.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#666" }}>{formatBytes(item.file.size)}</p>
                    </div>
                    {item.status === "idle" && (
                      <button type="button" onClick={() => removeItem(idx)} className="flex-shrink-0 mt-0.5">
                        <X size={14} color="#666" strokeWidth={2} />
                      </button>
                    )}
                    {item.status === "done" && (
                      <CheckCircle2 size={16} color="#D4FF4F" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                    )}
                    {item.status === "error" && (
                      <span className="text-xs" style={{ color: "#EF4444" }}>Failed</span>
                    )}
                  </div>

                  {/* Area tag selector */}
                  {item.status === "idle" && (
                    <div className="flex items-center gap-2">
                      <Tag size={12} color="#666" strokeWidth={2} />
                      <select
                        value={item.area}
                        onChange={(e) => setArea(idx, e.target.value as AreaTag)}
                        className="flex-1 rounded-lg px-2 py-1 text-xs"
                        style={{ ...inputStyle, fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        {AREA_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {item.status === "idle" && (
                    <div className="text-xs mt-1.5" style={{ color: "#555" }}>
                      Area: {AREA_OPTIONS.find((o) => o.value === item.area)?.label}
                    </div>
                  )}

                  {/* Progress bar */}
                  {(item.status === "uploading" || item.status === "done") && (
                    <div className="mt-2">
                      <div
                        className="rounded-full overflow-hidden"
                        style={{ height: 4, background: "rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress}%`,
                            backgroundColor: item.status === "done" ? "#D4FF4F" : "#8FD400",
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#666" }}>
                        {item.status === "done" ? "Uploaded" : `Uploading... ${item.progress}%`}
                      </p>
                    </div>
                  )}

                  {item.error && (
                    <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status messages */}
        {hasErrors && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-4"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
          >
            Some photos failed to upload. Check the errors above and try again.
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || items.length === 0 || !selectedMonth || allDone}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
          style={{
            backgroundColor: uploading || items.length === 0 || !selectedMonth || allDone ? "#1E1E1E" : "#D4FF4F",
            color: uploading || items.length === 0 || !selectedMonth || allDone ? "#909090" : "#0A0A0A",
            cursor: uploading ? "wait" : "pointer",
            height: "44px",
          }}
        >
          <CloudUpload size={16} strokeWidth={2} />
          {uploading
            ? "Uploading..."
            : allDone
            ? "All uploaded!"
            : `Upload ${items.length > 0 ? `${items.length} ` : ""}Photo${items.length !== 1 ? "s" : ""}`}
        </button>
      </form>
    </div>
  );
}
