"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Mail, Phone, Users } from "lucide-react";
import type { AggregatedContact } from "../pipeline/page";

function fmtR(n: number) {
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function ContactCard({ c }: { c: AggregatedContact }) {
  const isAgency = c.client_type === "agency";
  return (
    <div
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
      style={{ borderRadius: 16 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-bold text-white truncate"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {c.contact_name ?? "Unknown Contact"}
          </p>
          {c.client_name && (
            <p className="text-sm mt-0.5 truncate" style={{ color: "#A3A3A3" }}>
              {c.client_name}
            </p>
          )}
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: isAgency ? "rgba(255,107,53,0.15)" : "rgba(96,165,250,0.15)",
            color: isAgency ? "#FF6B35" : "#60A5FA",
          }}
        >
          {isAgency ? "Agency" : "Direct"}
        </span>
      </div>

      {/* Contact details */}
      <div className="space-y-1.5">
        {c.contact_email && (
          <div className="flex items-center gap-2">
            <Mail size={13} color="#A3A3A3" strokeWidth={2} className="flex-shrink-0" />
            <a
              href={`mailto:${c.contact_email}`}
              className="text-sm truncate hover:text-white transition-colors"
              style={{ color: "#C8C8C8" }}
            >
              {c.contact_email}
            </a>
          </div>
        )}
        {c.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} color="#A3A3A3" strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm" style={{ color: "#C8C8C8" }}>{c.contact_phone}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-1.5">
          <Users size={13} color="#8A8A8A" strokeWidth={2} />
          <span className="text-xs" style={{ color: "#8A8A8A" }}>
            {c.campaign_count} campaign{c.campaign_count !== 1 ? "s" : ""}
          </span>
        </div>
        {c.total_value > 0 && (
          <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>
            {fmtR(c.total_value)}
          </span>
        )}
      </div>

      {/* View campaigns */}
      <Link
        href={`/admin/campaigns?contact=${encodeURIComponent(c.contact_email || c.contact_name || "")}`}
        className="text-center text-xs font-semibold py-2 rounded-xl transition-opacity hover:opacity-80"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#C8C8C8",
        }}
      >
        View Campaigns
      </Link>
    </div>
  );
}

export default function ContactsClient({ contacts }: { contacts: AggregatedContact[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.contact_name?.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div className="p-4 md:p-8">
      {/* Hero */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Contacts
            </h1>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}
            >
              {contacts.length}
            </span>
          </div>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            All clients from campaigns, deduplicated by email
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          color="#666"
          strokeWidth={2}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          placeholder="Search by name, email, or company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl py-3 pl-10 pr-4 text-sm"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#FFFFFF",
            outline: "none",
          }}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-10 text-center"
          style={{ borderRadius: 16 }}
        >
          <p className="text-sm" style={{ color: "#A3A3A3" }}>
            {query ? "No contacts match your search." : "No contacts yet — they appear from campaigns."}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {filtered.map((c, i) => (
            <ContactCard key={c.contact_email || `no-email-${i}`} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
