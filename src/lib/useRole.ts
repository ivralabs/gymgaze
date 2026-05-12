"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolvePermissions, type RolePreset, type NavSlug } from "@/lib/permissions";

export type RoleState = {
  role: RolePreset;
  allowedSlugs: NavSlug[];
  isAdmin: boolean;
  isSales: boolean;
  canEdit: boolean;   // admin only — full CRUD
  canCreate: boolean; // admin + sales — can create new records
  loading: boolean;
};

const DEFAULT: RoleState = {
  role: "viewer",
  allowedSlugs: [],
  isAdmin: false,
  isSales: false,
  canEdit: false,
  canCreate: false,
  loading: true,
};

export function useRole(): RoleState {
  const [state, setState] = useState<RoleState>(DEFAULT);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState({ ...DEFAULT, loading: false }); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions")
        .eq("id", user.id)
        .single();

      const role = ((profile?.role ?? "viewer") as RolePreset);
      const perms = profile?.permissions as NavSlug[] | null;
      const allowedSlugs = resolvePermissions(role, perms);

      setState({
        role,
        allowedSlugs,
        isAdmin: role === "admin",
        isSales: role === "sales",
        canEdit: role === "admin",
        canCreate: role === "admin" || role === "sales",
        loading: false,
      });
    }
    load();
  }, []);

  return state;
}
