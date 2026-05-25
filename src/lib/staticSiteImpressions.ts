export const LOCATION_IMPRESSION_MULTIPLIERS: Record<
  string,
  { passRate: number; glancesPerPass: number; label: string }
> = {
  entrance:    { passRate: 1.00, glancesPerPass: 2, label: "Entrance" },
  reception:   { passRate: 0.95, glancesPerPass: 2, label: "Reception" },
  gym_floor:   { passRate: 0.85, glancesPerPass: 5, label: "Gym Floor" },
  changerooms: { passRate: 0.60, glancesPerPass: 2, label: "Changerooms" },
  car_park:    { passRate: 0.70, glancesPerPass: 2, label: "Car Park" },
  corridor:    { passRate: 0.75, glancesPerPass: 2, label: "Corridor" },
  other:       { passRate: 0.50, glancesPerPass: 1, label: "Other" },
};

export function suggestMonthlyImpressions(
  monthlyEntries: number | null,
  locationInVenue: string | null
): number | null {
  if (!monthlyEntries || monthlyEntries <= 0) return null;
  const cfg =
    LOCATION_IMPRESSION_MULTIPLIERS[locationInVenue ?? "other"] ??
    LOCATION_IMPRESSION_MULTIPLIERS.other;
  return Math.round(monthlyEntries * cfg.passRate * cfg.glancesPerPass);
}

export function impressionSuggestionCaption(
  monthlyEntries: number,
  locationInVenue: string | null
): string {
  const key = locationInVenue ?? "other";
  const cfg =
    LOCATION_IMPRESSION_MULTIPLIERS[key] ??
    LOCATION_IMPRESSION_MULTIPLIERS.other;
  const result = Math.round(monthlyEntries * cfg.passRate * cfg.glancesPerPass);
  const passRatePct = Math.round(cfg.passRate * 100);
  return `Based on ${monthlyEntries.toLocaleString("en-ZA")} monthly entries × ${passRatePct}% ${cfg.label.toLowerCase()} pass-rate × ${cfg.glancesPerPass} glance${cfg.glancesPerPass !== 1 ? "s" : ""} = ${result.toLocaleString("en-ZA")}`;
}
