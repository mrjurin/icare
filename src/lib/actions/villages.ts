"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone, getAccessibleZoneIdsReadOnly } from "@/lib/utils/access-control";

export type Village = {
  id: number;
  cawangan_id: number;
  zone_id: number | null; // Keep for backward compatibility
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  cawangan?: {
    id: number;
    name: string;
  };
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
  cawanganId: number;
  name: string;
  description?: string;
};

export type UpdateVillageInput = {
  id: number;
  cawanganId?: number;
  name?: string;
  description?: string;
};

/**
 * Get villages for a specific zone (public - no authentication required)
 * Used for public forms like community registration
 */
export async function getVillagesPublic(zoneId: number): Promise<ActionResult<Village[]>> {
  if (!zoneId || Number.isNaN(zoneId)) {
    return { success: false, error: "Zone ID is required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("villages")
    .select("*")
    .eq("zone_id", zoneId)
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Village[] };
}

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

  // Get cawangan to find zone
  const { data: cawanganData } = await supabase
    .from("cawangan")
    .select("id, name, zone_id")
    .eq("id", data.cawangan_id)
    .single();

  if (!cawanganData) {
    return { success: false, error: "Cawangan not found for this village" };
  }

  // Check if user can access the zone this village belongs to
  const canAccess = await canAccessZone(cawanganData.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this village" };
  }

  // Fetch zone information
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", cawanganData.zone_id)
    .single();

  const village = data as Village;
  if (cawanganData) {
    village.cawangan = { id: cawanganData.id, name: cawanganData.name };
  }
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

  if (!input.cawanganId || Number.isNaN(input.cawanganId)) {
    return { success: false, error: "Cawangan is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to create villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create villages" };
  }

  // Get cawangan to check zone access
  const { data: cawanganData } = await supabase
    .from("cawangan")
    .select("id, name, zone_id")
    .eq("id", input.cawanganId)
    .single();

  if (!cawanganData) {
    return { success: false, error: "Selected cawangan does not exist" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(cawanganData.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to create villages in this zone" };
  }

  // Check if village with same name already exists in this cawangan
  const { data: existing } = await supabase
    .from("villages")
    .select("id")
    .eq("name", input.name.trim())
    .eq("cawangan_id", input.cawanganId)
    .single();

  if (existing) {
    return { success: false, error: "A village with this name already exists in this cawangan" };
  }

  const { data, error } = await supabase
    .from("villages")
    .insert({
      cawangan_id: input.cawanganId,
      zone_id: cawanganData.zone_id, // Keep for backward compatibility
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch cawangan and zone information
  const village = data as Village;
  village.cawangan = { id: cawanganData.id, name: cawanganData.name };
  
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", cawanganData.zone_id)
    .single();

  if (zoneData) {
    village.zones = zoneData;
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${cawanganData.zone_id}`);
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
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to update villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update villages" };
  }

  // Get the current village to check zone access
  const { data: currentVillage } = await supabase
    .from("villages")
    .select("cawangan_id, zone_id")
    .eq("id", input.id)
    .single();

  if (!currentVillage) {
    return { success: false, error: "Village not found" };
  }

  // Get current cawangan to find zone
  const { data: currentCawangan } = await supabase
    .from("cawangan")
    .select("id, zone_id")
    .eq("id", currentVillage.cawangan_id)
    .single();

  if (!currentCawangan) {
    return { success: false, error: "Cawangan not found for this village" };
  }

  // Determine which cawangan to check access for
  let cawanganIdToCheck = input.cawanganId || currentVillage.cawangan_id;
  let zoneIdToCheck = currentCawangan.zone_id;

  // If cawangan is being changed, get the new cawangan's zone
  if (input.cawanganId && input.cawanganId !== currentVillage.cawangan_id) {
    const { data: newCawangan } = await supabase
      .from("cawangan")
      .select("id, zone_id")
      .eq("id", input.cawanganId)
      .single();

    if (!newCawangan) {
      return { success: false, error: "Selected cawangan does not exist" };
    }

    zoneIdToCheck = newCawangan.zone_id;
    const canAccessNewZone = await canAccessZone(zoneIdToCheck);
    if (!canAccessNewZone) {
      return { success: false, error: "Access denied: You do not have permission to assign villages to this cawangan" };
    }

    // Check if village with same name already exists in the new cawangan
    const { data: existing } = await supabase
      .from("villages")
      .select("id")
      .eq("name", input.name?.trim() || "")
      .eq("cawangan_id", input.cawanganId)
      .neq("id", input.id)
      .single();

    if (existing) {
      return { success: false, error: "A village with this name already exists in the target cawangan" };
    }
  } else {
    const canAccess = await canAccessZone(zoneIdToCheck);
    if (!canAccess) {
      return { success: false, error: "Access denied: You do not have permission to update this village" };
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.cawanganId !== undefined) {
    // Get the new cawangan's zone_id for backward compatibility
    const { data: newCawangan } = await supabase
      .from("cawangan")
      .select("zone_id")
      .eq("id", input.cawanganId)
      .single();

    if (newCawangan) {
      updates.cawangan_id = input.cawanganId;
      updates.zone_id = newCawangan.zone_id; // Keep for backward compatibility
    }
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

  // Fetch cawangan and zone information
  const finalCawanganId = input.cawanganId || currentVillage.cawangan_id;
  const { data: cawanganData } = await supabase
    .from("cawangan")
    .select("id, name, zone_id")
    .eq("id", finalCawanganId)
    .single();

  const village = data as Village;
  if (cawanganData) {
    village.cawangan = { id: cawanganData.id, name: cawanganData.name };
    
    const { data: zoneData } = await supabase
      .from("zones")
      .select("id, name")
      .eq("id", cawanganData.zone_id)
      .single();

  if (zoneData) {
    village.zones = zoneData;
    }
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${currentCawangan.zone_id}`);
  if (input.cawanganId && input.cawanganId !== currentVillage.cawangan_id && cawanganData) {
    revalidatePath(`/admin/zones/${cawanganData.zone_id}`);
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
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to delete villages
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete villages" };
  }

  // Get the village to check zone access
  const { data: village } = await supabase
    .from("villages")
    .select("cawangan_id")
    .eq("id", id)
    .single();

  if (!village) {
    return { success: false, error: "Village not found" };
  }

  // Get cawangan to find zone
  const { data: cawanganData } = await supabase
    .from("cawangan")
    .select("zone_id")
    .eq("id", village.cawangan_id)
    .single();

  if (!cawanganData) {
    return { success: false, error: "Cawangan not found for this village" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(cawanganData.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to delete this village" };
  }

  const { error } = await supabase.from("villages").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/villages");
  revalidatePath(`/admin/zones/${cawanganData.zone_id}`);
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
 * Get village count for zones (read-only version for Server Components)
 * Use this in Server Components to avoid cookie modification errors
 */
export async function getVillageCountsByZoneReadOnly(zoneIds?: number[]): Promise<ActionResult<Record<number, number>>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();

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

/**
 * Get village count for zones
 * Use this in Server Actions where cookie modification is allowed
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
