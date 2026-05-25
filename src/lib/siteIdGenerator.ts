// ─── Site ID Generator ────────────────────────────────────────────────────────
// Structured Site IDs for GymGaze static sites.
// Format: <brand>-<metro>-<venue>-S<orientation><seq>
// Example: EF-BCM-BEA-SL1

// Compute orientation from dimensions (landscape if width >= height)
export function siteOrientation(
  widthCm?: number | null,
  heightCm?: number | null
): "L" | "P" | null {
  if (!widthCm || !heightCm) return null;
  return widthCm >= heightCm ? "L" : "P";
}

// Generate a structured Site ID
// Format: <brand>-<metro>-<venue>-S<orientation><seq>
// e.g. EF-BCM-BEA-SL1
export function generateSiteId(opts: {
  brandCode?: string | null;
  metroCode?: string | null;
  venueCode?: string | null;
  widthCm?: number | null;
  heightCm?: number | null;
  sequence: number;
}): string {
  const brand = (opts.brandCode || "GYM").toUpperCase();
  const metro = (opts.metroCode || "MET").toUpperCase();
  const venue = (opts.venueCode || "VEN").toUpperCase();
  const orient = siteOrientation(opts.widthCm, opts.heightCm) ?? "L";
  return `${brand}-${metro}-${venue}-S${orient}${opts.sequence}`;
}

// Backwards-compat short ID (for displaying on UUID-based PDF cards)
export function fmtSiteUuid(uuid: string): string {
  return `SS-${uuid.slice(0, 8)}`;
}

// Returns the structured ID if the label matches the pattern, else the short UUID id.
export function displaySiteId(label: string | null | undefined, uuid: string): string {
  if (label && /^[A-Z]{2,4}-[A-Z]{2,4}-[A-Z]{2,4}-S[LP]\d+$/.test(label)) {
    return label;
  }
  return fmtSiteUuid(uuid);
}
