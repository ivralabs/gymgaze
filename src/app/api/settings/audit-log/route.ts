import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const action = searchParams.get("action") ?? "";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const userId = searchParams.get("user") ?? "";
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_log")
      .select("id, action, record_type, record_id, record_name, metadata, created_at, admin_id, profiles!audit_log_admin_id_fkey(full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq("action", action);
    if (userId) query = query.eq("admin_id", userId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to + "T23:59:59Z");

    const { data, error, count } = await query;

    if (error) {
      // Table may not exist yet — return empty
      return NextResponse.json({ rows: [], total: 0, page, limit });
    }

    return NextResponse.json({ rows: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error("[GET /api/settings/audit-log]", err);
    return NextResponse.json({ rows: [], total: 0, page: 1, limit: 50 });
  }
}
