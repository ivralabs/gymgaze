import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScreenDetailClient from "./ScreenDetailClient";

interface ScreenFromDB {
  id: string;
  label: string;
  location_in_venue: string | null;
  size_inches: number | null;
  orientation: string | null;
  resolution: string | null;
  is_active: boolean | null;
  cuecast_status: string | null;
  cuecast_last_seen: string | null;
  cuecast_player_token: string | null;
  notes: string | null;
  created_at: string;
  venue_id: string | null;
  venues:
    | { id: string; name: string; city: string | null; province: string | null }
    | { id: string; name: string; city: string | null; province: string | null }[]
    | null;
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ScreenDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawScreen, error } = await supabase
    .from("screens")
    .select(
      `
      id,
      label,
      location_in_venue,
      size_inches,
      orientation,
      resolution,
      is_active,
      cuecast_status,
      cuecast_last_seen,
      cuecast_player_token,
      notes,
      created_at,
      venue_id,
      photo_url,
      venues (
        id,
        name,
        city,
        province
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !rawScreen) {
    notFound();
  }

  const screen = rawScreen as unknown as ScreenFromDB;

  // Supabase can return venues as array or object; normalise to single object
  const venueRaw = screen.venues;
  const venueNorm = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city")
    .order("name");

  return (
    <ScreenDetailClient
      screen={{ ...screen, venues: venueNorm, photo_url: (screen as unknown as Record<string, unknown>).photo_url as string | null ?? null }}
      venues={venues ?? []}
      defaultEdit={edit === "true"}
    />
  );
}
