import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddVenueForm from "../add-venue-form";

export default async function NewVenuePage() {
  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("gym_brands")
    .select("id, name")
    .order("name");

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/venues"
          className="p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
        >
          New Venue
        </h1>
      </div>
      <AddVenueForm brands={brands ?? []} />
    </div>
  );
}
