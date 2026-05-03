// GymGaze permissions config
// Nav slugs map 1:1 to sidebar href segments

export const NAV_PAGES = [
  { slug: "dashboard",  label: "Dashboard" },
  { slug: "networks",   label: "Networks" },
  { slug: "venues",     label: "Venues" },
  { slug: "campaigns",  label: "Campaigns" },
  { slug: "inventory",  label: "Inventory" },
  { slug: "revenue",    label: "Revenue" },
  { slug: "analytics",  label: "Analytics" },
  { slug: "photos",     label: "Proof Of Flight" },
  { slug: "insights",   label: "Insights" },
  { slug: "settings",   label: "Settings" },
] as const;

export type NavSlug = typeof NAV_PAGES[number]["slug"];

export type RolePreset = "admin" | "manager" | "sales" | "viewer" | "custom";

// Default permissions per role preset
export const ROLE_DEFAULTS: Record<RolePreset, NavSlug[]> = {
  admin:   ["dashboard", "networks", "venues", "campaigns", "inventory", "revenue", "analytics", "photos", "insights", "settings"],
  manager: ["dashboard", "venues", "photos"],
  sales:   ["dashboard", "campaigns", "revenue", "insights"],
  viewer:  ["dashboard", "analytics", "insights"],
  custom:  [], // filled by the custom permissions array
};

export const ROLE_LABELS: Record<RolePreset, string> = {
  admin:   "Super Admin",
  manager: "Manager",
  sales:   "Sales",
  viewer:  "Viewer",
  custom:  "Custom",
};

export const ROLE_DESCRIPTIONS: Record<RolePreset, string> = {
  admin:   "Full access to everything",
  manager: "Venues, photos & portal management",
  sales:   "Campaigns, revenue & insights",
  viewer:  "Read-only dashboard & analytics",
  custom:  "Hand-picked pages only",
};

export const ROLE_COLORS: Record<RolePreset, { bg: string; text: string }> = {
  admin:   { bg: "rgba(212,255,79,0.12)",  text: "#D4FF4F" },
  manager: { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  sales:   { bg: "rgba(251,146,60,0.12)",  text: "#FB923C" },
  viewer:  { bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
  custom:  { bg: "rgba(244,114,182,0.12)", text: "#F472B6" },
};

// Resolve effective permissions for a profile
export function resolvePermissions(role: RolePreset, customPerms?: NavSlug[] | null): NavSlug[] {
  if (role === "admin") return NAV_PAGES.map((p) => p.slug); // admins always get everything
  if (role === "custom" && customPerms?.length) return customPerms;
  return ROLE_DEFAULTS[role] ?? [];
}

// Can a user access a given nav slug?
export function canAccess(role: RolePreset, customPerms: NavSlug[] | null, slug: NavSlug): boolean {
  const perms = resolvePermissions(role, customPerms);
  return perms.includes(slug);
}
