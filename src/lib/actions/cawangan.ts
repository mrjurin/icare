"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone, getAccessibleZoneIdsReadOnly } from "@/lib/utils/access-control";

export type Cawangan = {
  id: number;
  zone_id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CawanganWithZone = Cawangan & {
  zone?: {
    id: number;
    name: string;
  } | null;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateCawanganInput = {
  zoneId: number;
  name: string;
  code?: string;
  description?: string;
};

export type UpdateCawanganInput = {
  id: number;
  zoneId?: number;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
};

/**
 * Get all cawangan for a zone (public - no authentication required)
 * Used for public forms like membership applications
 */
export async function getCawanganPublic(zoneId: number): Promise<ActionResult<Cawangan[]>> {
  if (!zoneId || Number.isNaN(zoneId)) {
    return { success: false, error: "Zone ID is required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("cawangan")
    .select("*")
    .eq("zone_id", zoneId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Cawangan[] };
}

/**
 * Get all cawangan accessible to the current user (read-only version for Server Components)
 * Filters by accessible zones based on user role
 */
export async function getCawanganReadOnly(zoneId?: number): Promise<ActionResult<Cawangan[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();

  let query = supabase
    .from("cawangan")
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
    // Check if user can access this zone
    if (accessibleZoneIds !== null) {
      const { canAccessZone } = await import("@/lib/utils/access-control");
      if (!await canAccessZone(zoneId)) {
        return { success: false, error: "Access denied: You do not have permission to view cawangan in this zone" };
      }
    }
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Cawangan[] };
}

/**
 * Get all cawangan accessible to the current user
 * Filters by accessible zones based on user role
 */
export async function getCawangan(zoneId?: number): Promise<ActionResult<Cawangan[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("cawangan")
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
    // Check if user can access this zone
    const canAccess = await canAccessZone(zoneId);
    if (!canAccess) {
      return { success: false, error: "Access denied: You do not have permission to view cawangan in this zone" };
    }
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Cawangan[] };
}

/**
 * Get a single cawangan by ID
 * Checks access control before returning
 */
export async function getCawanganById(id: number): Promise<ActionResult<CawanganWithZone>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid cawangan ID" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("cawangan")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Cawangan not found" };
  }

  // Check if user can access the zone this cawangan belongs to
  const canAccess = await canAccessZone(data.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this cawangan" };
  }

  // Fetch zone information
  const { data: zoneData } = await supabase
    .from("zones")
    .select("id, name")
    .eq("id", data.zone_id)
    .single();

  const cawangan = data as Cawangan;
  const result: CawanganWithZone = {
    ...cawangan,
    zone: zoneData ? { id: zoneData.id, name: zoneData.name } : null,
  };

  return { success: true, data: result };
}

/**
 * Create a new cawangan
 * Only super admin and ADUN can create cawangan
 */
export async function createCawangan(input: CreateCawanganInput): Promise<ActionResult<Cawangan>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Cawangan name is required" };
  }

  if (!input.zoneId || Number.isNaN(input.zoneId)) {
    return { success: false, error: "Zone is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to create cawangan
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create cawangan" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(input.zoneId);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to create cawangan in this zone" };
  }

  // Check if cawangan with same name already exists in this zone
  const { data: existing } = await supabase
    .from("cawangan")
    .select("id")
    .eq("name", input.name.trim())
    .eq("zone_id", input.zoneId)
    .single();

  if (existing) {
    return { success: false, error: "A cawangan with this name already exists in this zone" };
  }

  const { data, error } = await supabase
    .from("cawangan")
    .insert({
      zone_id: input.zoneId,
      name: input.name.trim(),
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/cawangan");
  revalidatePath(`/admin/zones/${input.zoneId}`);
  return { success: true, data: data as Cawangan };
}

/**
 * Update an existing cawangan
 * Only super_admin and ADUN can update cawangan
 */
export async function updateCawangan(input: UpdateCawanganInput): Promise<ActionResult<Cawangan>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid cawangan ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to update cawangan
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update cawangan" };
  }

  // Get the current cawangan to check zone access
  const { data: currentCawangan } = await supabase
    .from("cawangan")
    .select("zone_id")
    .eq("id", input.id)
    .single();

  if (!currentCawangan) {
    return { success: false, error: "Cawangan not found" };
  }

  const zoneIdToCheck = input.zoneId || currentCawangan.zone_id;
  const canAccess = await canAccessZone(zoneIdToCheck);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to update this cawangan" };
  }

  // If zone is being changed, check if user can access the new zone
  if (input.zoneId && input.zoneId !== currentCawangan.zone_id) {
    const canAccessNewZone = await canAccessZone(input.zoneId);
    if (!canAccessNewZone) {
      return { success: false, error: "Access denied: You do not have permission to assign cawangan to this zone" };
    }

    // Check if cawangan with same name already exists in the new zone
    const { data: existing } = await supabase
      .from("cawangan")
      .select("id")
      .eq("name", input.name?.trim() || "")
      .eq("zone_id", input.zoneId)
      .neq("id", input.id)
      .single();

    if (existing) {
      return { success: false, error: "A cawangan with this name already exists in the target zone" };
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
      return { success: false, error: "Cawangan name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.code !== undefined) {
    updates.code = input.code?.trim() || null;
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("cawangan")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/cawangan");
  revalidatePath(`/admin/zones/${currentCawangan.zone_id}`);
  if (input.zoneId && input.zoneId !== currentCawangan.zone_id) {
    revalidatePath(`/admin/zones/${input.zoneId}`);
  }
  return { success: true, data: data as Cawangan };
}

/**
 * Delete a cawangan
 * Only super_admin and ADUN can delete cawangan
 */
export async function deleteCawangan(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid cawangan ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to delete cawangan
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete cawangan" };
  }

  // Get the cawangan to check zone access
  const { data: cawangan } = await supabase
    .from("cawangan")
    .select("zone_id")
    .eq("id", id)
    .single();

  if (!cawangan) {
    return { success: false, error: "Cawangan not found" };
  }

  // Check if user can access the zone
  const canAccess = await canAccessZone(cawangan.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to delete this cawangan" };
  }

  // Check if any villages are using this cawangan
  const { data: villages } = await supabase
    .from("villages")
    .select("id")
    .eq("cawangan_id", id)
    .limit(1);

  if (villages && villages.length > 0) {
    return {
      success: false,
      error: "Cannot delete cawangan: There are villages assigned to this cawangan. Please reassign them first.",
    };
  }

  const { error } = await supabase.from("cawangan").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/cawangan");
  revalidatePath(`/admin/zones/${cawangan.zone_id}`);
  return { success: true };
}

/**
 * Get cawangan count for zones (read-only version for Server Components)
 */
export async function getCawanganCountsByZoneReadOnly(zoneIds?: number[]): Promise<ActionResult<Record<number, number>>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();

  let query = supabase.from("cawangan").select("zone_id");

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

  // Count cawangan per zone
  const counts: Record<number, number> = {};
  (data || []).forEach((cawangan) => {
    counts[cawangan.zone_id] = (counts[cawangan.zone_id] || 0) + 1;
  });

  return { success: true, data: counts };
}

/**
 * Get cawangan count for zones
 */
export async function getCawanganCountsByZone(zoneIds?: number[]): Promise<ActionResult<Record<number, number>>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase.from("cawangan").select("zone_id");

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

  // Count cawangan per zone
  const counts: Record<number, number> = {};
  (data || []).forEach((cawangan) => {
    counts[cawangan.zone_id] = (counts[cawangan.zone_id] || 0) + 1;
  });

  return { success: true, data: counts };
}
