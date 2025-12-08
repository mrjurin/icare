"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone } from "@/lib/utils/accessControl";

export type Village = {
  id: number;
  zone_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  zones?: {
    id: number;
    name: string;
  };
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateVillageInput = {
  zoneId: number;
  name: string;
  description?: string;
};

export type UpdateVillageInput = {
  id: number;
  zoneId?: number;
  name?: string;
  description?: string;
};

/**
 * Get all villages accessible to the current user
 * Filters by accessible zones based on user role
 */
export async function getVillages(zoneId?: number): Promise<ActionResult<Village[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("villages")
    .select("*")
    .order("name", { ascending: true });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  // Filter by specific zone if provided
  if (zoneId) {
    // For super admin and ADUN, accessibleZoneIds is null (all zones accessible)
    // For zone leaders, accessibleZoneIds is an array of their zones
    // Only check access if user is restricted (not super admin or ADUN)
    if (accessibleZoneIds !== null) {
      // User is restricted to specific zones, check if they can access this zone
      const canAccess = await canAccessZone(zoneId);
      if (!canAccess) {
        return { success: false, error: "Access denied: You do not have permission to view villages in this zone" };
      }
    }
    // Apply zone filter
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch zone information separately
  const villageData = (data || []) as Village[];
  if (villageData.length > 0) {
    const zoneIds = [...new Set(villageData.map((v) => v.zone_id))];
    const { data: zonesData } = await supabase
      .from("zones")
      .select("id, name")
      .in("id", zoneIds);

    const zonesMap = new Map((zonesData || []).map((z) => [z.id, z]));

    // Merge zone data into villages
    villageData.forEach((village) => {
      const zone = zonesMap.get(village.zone_id);
      if (zone) {
        village.zones = zone;
      }
    });
  }

  return { success: true, data: villageData };
}

/**
 * Get a single village by ID
 * Checks access control before returning
 */
export async function getVillageById(id: number): Promise<ActionResult<Village>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid village ID" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("villages")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Village not found" };
  }

  // Check if user can access the zone this village belongs to
  const canAccess = await canAccessZone(data.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this village" };
  }

  // Fetch zone information
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", data.zone_id)
    .single();

  const village = data as Village;
  if (zoneData) {
    village.zones = zoneData;
  }

  return { success: true, data: village };
}

/**
 * Create a new village
 * Only super admin and ADUN can create villages
 */
export async function createVillage(input: CreateVillageInput): Promise<ActionResult<Village>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Village name is required" };
  }

  if (!input.zoneId || Number.isNaN(input.zoneId)) {
    return { success: false, error: "Zone is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to create villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create villages" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(input.zoneId);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to create villages in this zone" };
  }

  // Check if village with same name already exists in this zone
  const { data: existing } = await supabase
    .from("villages")
    .select("id")
    .eq("name", input.name.trim())
    .eq("zone_id", input.zoneId)
    .single();

  if (existing) {
    return { success: false, error: "A village with this name already exists in this zone" };
  }

  const { data, error } = await supabase
    .from("villages")
    .insert({
      zone_id: input.zoneId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch zone information
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", input.zoneId)
    .single();

  const village = data as Village;
  if (zoneData) {
    village.zones = zoneData;
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${input.zoneId}`);
  return { success: true, data: village };
}

/**
 * Update an existing village
 * Only super_admin and ADUN can update villages
 */
export async function updateVillage(input: UpdateVillageInput): Promise<ActionResult<Village>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid village ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to update villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update villages" };
  }

  // Get the current village to check zone access
  const { data: currentVillage } = await supabase
    .from("villages")
    .select("zone_id")
    .eq("id", input.id)
    .single();

  if (!currentVillage) {
    return { success: false, error: "Village not found" };
  }

  const zoneIdToCheck = input.zoneId || currentVillage.zone_id;
  const canAccess = await canAccessZone(zoneIdToCheck);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to update this village" };
  }

  // If zone is being changed, check if user can access the new zone
  if (input.zoneId && input.zoneId !== currentVillage.zone_id) {
    const canAccessNewZone = await canAccessZone(input.zoneId);
    if (!canAccessNewZone) {
      return { success: false, error: "Access denied: You do not have permission to assign villages to this zone" };
    }

    // Check if village with same name already exists in the new zone
    const { data: existing } = await supabase
      .from("villages")
      .select("id")
      .eq("name", input.name?.trim() || "")
      .eq("zone_id", input.zoneId)
      .neq("id", input.id)
      .single();

    if (existing) {
      return { success: false, error: "A village with this name already exists in the target zone" };
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.zoneId !== undefined) {
    updates.zone_id = input.zoneId;
  }

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Village name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from("villages")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch zone information
  const finalZoneId = input.zoneId || currentVillage.zone_id;
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", finalZoneId)
    .single();

  const village = data as Village;
  if (zoneData) {
    village.zones = zoneData;
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${currentVillage.zone_id}`);
  if (input.zoneId && input.zoneId !== currentVillage.zone_id) {
    revalidatePath(`/admin/zones/${input.zoneId}`);
  }
  return { success: true, data: village };
}

/**
 * Delete a village
 * Only super_admin and ADUN can delete villages
 */
export async function deleteVillage(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid village ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to delete villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete villages" };
  }

  // Get the village to check zone access
  const { data: village } = await supabase
    .from("villages")
    .select("zone_id")
    .eq("id", id)
    .single();

  if (!village) {
    return { success: false, error: "Village not found" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(village.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to delete this village" };
  }

  const { error } = await supabase.from("villages").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${village.zone_id}`);
  return { success: true };
}

/**
 * Get villages that are not in a specific zone
 * Returns villages from other zones that can be reassigned
 */
export async function getVillagesNotInZone(zoneId: number): Promise<ActionResult<Village[]>> {
  if (!zoneId || Number.isNaN(zoneId)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if user can access the target zone
  const canAccess = await canAccessZone(zoneId);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to access this zone" };
  }

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("villages")
    .select("*")
    .neq("zone_id", zoneId)
    .order("name", { ascending: true });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    // Only show villages from zones the user can access
    query = query.in("zone_id", accessibleZoneIds);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch zone information separately
  const villageData = (data || []) as Village[];
  if (villageData.length > 0) {
    const zoneIds = [...new Set(villageData.map((v) => v.zone_id))];
    const { data: zonesData } = await supabase
      .from("zones")
      .select("id, name")
      .in("id", zoneIds);

    const zonesMap = new Map((zonesData || []).map((z) => [z.id, z]));

    // Merge zone data into villages
    villageData.forEach((village) => {
      const zone = zonesMap.get(village.zone_id);
      if (zone) {
        village.zones = zone;
      }
    });
  }

  return { success: true, data: villageData };
}

/**
 * Get village count for zones
 */
export async function getVillageCountsByZone(zoneIds?: number[]): Promise<ActionResult<Record<number, number>>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase.from("villages").select("zone_id");

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: {} };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  // Filter by specific zones if provided
  if (zoneIds && zoneIds.length > 0) {
    query = query.in("zone_id", zoneIds);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Count villages per zone
  const counts: Record<number, number> = {};
  (data || []).forEach((village) => {
    counts[village.zone_id] = (counts[village.zone_id] || 0) + 1;
  });

  return { success: true, data: counts };
}
