"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CloudUpload, CheckCircle2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UploadPhotoPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Generate last 6 months options
  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...arr]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMonth || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("venue_id")
        .eq("id", user.id)
        .single();

      if (!profile?.venue_id) throw new Error("No venue assigned to your account");

      for (const file of files) {
        const path = `${profile.venue_id}/${selectedMonth}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("venue-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("venue_photos").insert({
          venue_id: profile.venue_id,
          storage_path: path,
          uploaded_by: user.id,
          month: `${selectedMonth}-01`,
          status: "pending",
        });
        if (dbError) throw dbError;
      }

      setSuccess(true);
      setFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle2 size={56} color="#059669" strokeWidth={1.5} className="mb-4" />
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
        >
          Photos submitted!
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          Your photos are pending approval by the GymGaze team.
        </p>
        <Link
          href="/portal/manager"
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#FF6B35" }}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/portal/manager"
          className="p-2 rounded-lg"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            Upload Screen Photos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Submit monthly proof-of-display photos
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        <div
          className="rounded-xl p-6 mb-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "#374151" }}
          >
            Select Month *
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              color: "#111827",
              outline: "none",
            }}
          >
            <option value="">Choose month...</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="rounded-xl p-6 mb-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          {/* Drop zone */}
          <div
            className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-150"
            style={{
              border: `2px dashed ${dragOver ? "#E55A2B" : "#FF6B35"}`,
              backgroundColor: dragOver ? "rgba(255,107,53,0.1)" : "rgba(255,107,53,0.05)",
              padding: "48px 24px",
              minHeight: "200px",
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <CloudUpload size={48} color="#FF6B35" strokeWidth={1.5} className="mb-3" />
            <p
              className="text-base font-medium text-center"
              style={{ color: "#374151" }}
            >
              Drop photos here or tap to browse
            </p>
            <p className="text-sm mt-1 text-center" style={{ color: "#9CA3AF" }}>
              JPG, PNG &mdash; all screens from this month
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                >
                  <span className="text-sm text-gray-700 truncate max-w-xs">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="ml-2 flex-shrink-0"
                  >
                    <X size={14} color="#9CA3AF" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm mb-4"
            style={{
              backgroundColor: "rgba(220,38,38,0.05)",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "#DC2626",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || files.length === 0 || !selectedMonth}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white transition-colors duration-150"
          style={{
            backgroundColor:
              uploading || files.length === 0 || !selectedMonth
                ? "#9CA3AF"
                : "#FF6B35",
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          <CloudUpload size={16} strokeWidth={2} />
          {uploading
            ? "Uploading..."
            : `Upload ${files.length > 0 ? `${files.length} ` : ""}Photo${files.length !== 1 ? "s" : ""}`}
        </button>
      </form>
    </div>
  );
}
