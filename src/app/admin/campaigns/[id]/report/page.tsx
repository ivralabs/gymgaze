export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReportClient from "./ReportClient";

// ─── Media model constants ────────────────────────────────────────────────────
const PLAYS_PER_SCREEN_PER_WEEK = 1596;
const EYEBALLS_PER_PLAY = 4;
const ACTIVE_RATE = 0.65;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function weeksBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24 * 7)));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServiceClient();

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      `id, client_name, client_type, contact_name, contact_email,
       format, status, start_date, end_date, total_value, created_at`
    )
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();

  // Fetch campaign_venues + venues
  type VenueJoin = {
    id: string;
    slot_count: number;
    venue_id: string;
    venues: {
      id: string;
      name: string;
      city: string | null;
      active_members: number | null;
    } | null;
  };

  const { data: campaignVenuesRaw } = await supabase
    .from("campaign_venues")
    .select("id, slot_count, venue_id, venues(id, name, city, active_members)")
    .eq("campaign_id", id);

  const campaignVenues = (campaignVenuesRaw ?? []) as unknown as VenueJoin[];
  const venueIds = campaignVenues.map((cv) => cv.venue_id).filter(Boolean);

  // Fetch approved venue_photos for these venues
  type VenuePhoto = {
    id: string;
    venue_id: string;
    storage_path: string | null;
    area_tag: string | null;
    month: string | null;
  };

  const { data: venuePhotosRaw } = venueIds.length
    ? await supabase
        .from("venue_photos")
        .select("id, venue_id, storage_path, area_tag, month")
        .eq("status", "approved")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const venuePhotos = (venuePhotosRaw ?? []) as VenuePhoto[];

  // Build photo URLs from storage
  const photoUrls: { id: string; venue_id: string; url: string; area_tag: string | null; month: string | null }[] =
    venuePhotos
      .filter((p) => p.storage_path)
      .map((p) => ({
        id: p.id,
        venue_id: p.venue_id,
        area_tag: p.area_tag,
        month: p.month,
        url: supabase.storage.from("venue-photos").getPublicUrl(p.storage_path!).data.publicUrl,
      }));

  // Build venue rows
  const weeks = weeksBetween(campaign.start_date, campaign.end_date);

  const venueRows = campaignVenues
    .filter((cv) => cv.venues)
    .map((cv) => {
      const v = cv.venues!;
      const screens = cv.slot_count ?? 1;
      const playsTotal = screens * PLAYS_PER_SCREEN_PER_WEEK * weeks;
      const membersReached = Math.round((v.active_members ?? 0) * ACTIVE_RATE);
      return {
        venue_id: v.id,
        name: v.name,
        city: v.city,
        screens,
        plays: playsTotal,
        members_reached: membersReached,
      };
    });

  // Aggregate metrics
  const totalScreens = venueRows.reduce((s, v) => s + v.screens, 0);
  const totalPlays = venueRows.reduce((s, v) => s + v.plays, 0);
  const totalImpressions = totalPlays * EYEBALLS_PER_PLAY;
  const totalMembersReached = venueRows.reduce((s, v) => s + v.members_reached, 0);
  const frequency = totalMembersReached > 0 ? Math.round(totalImpressions / totalMembersReached) : 0;

  const reportProps = {
    campaign: {
      id: campaign.id,
      client_name: campaign.client_name,
      client_type: campaign.client_type,
      contact_name: campaign.contact_name,
      contact_email: campaign.contact_email,
      format: campaign.format,
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      total_value: campaign.total_value,
    },
    metrics: {
      totalScreens,
      totalVenues: venueRows.length,
      weeks,
      totalPlays,
      totalImpressions,
      totalMembersReached,
      frequency,
    },
    venueRows,
    photos: photoUrls,
    generatedAt: new Date().toISOString(),
  };

  return <ReportClient {...reportProps} />;
}
