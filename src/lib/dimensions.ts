/** Convert cm (integer) -> meters (number with up to 2 decimals) */
export function cmToM(cm: number | null | undefined): number | null {
  if (cm == null) return null;
  return Math.round(cm) / 100;
}

/** Convert meters (number) -> cm (integer, rounded). Empty/invalid -> null. */
export function mToCm(meters: string | number | null | undefined): number | null {
  if (meters === "" || meters == null) return null;
  const n = typeof meters === "string" ? parseFloat(meters) : meters;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Format dimensions for display, e.g. "1.50 × 2.00 m" or "1.5×2 m" */
export function fmtDimensionsM(
  widthCm: number | null | undefined,
  heightCm: number | null | undefined,
  opts?: { compact?: boolean }
): string {
  const w = cmToM(widthCm);
  const h = cmToM(heightCm);
  if (w == null && h == null) return "—";
  const fmt = (v: number | null) => {
    if (v == null) return "?";
    if (opts?.compact) return String(v); // strip trailing zeros
    return v.toFixed(2);
  };
  return `${fmt(w)} × ${fmt(h)} m`;
}
