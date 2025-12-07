"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone } from "@/lib/utils/accessControl";

export type Zone = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ZoneStatistics = {
  zone_id: number;
  zone_name: string;
  total_people: number;
  total_children: number;
  total_eligible_voters: number;
  locality_breakdown: Array<{
    locality: string;
    count: number;
  }>;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateZoneInput = {
  name: string;
  description?: string;
};

export type UpdateZoneInput = {
  id: number;
  name?: string;
  description?: string;
};

/**
 * Get all zones accessible to the current user
 * Zone leaders only see their assigned zone
 * Super admin and ADUN see all zones
 */
export async function getZones(): Promise<ActionResult<Zone[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("zones")
    .select("*")
    .order("name", { ascending: true });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    query = query.in("id", accessibleZoneIds);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Zone[] };
}

/**
 * Get a single zone by ID
 * Checks access control before returning
 */
export async function getZoneById(id: number): Promise<ActionResult<Zone>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if user can access this zone
  const canAccess = await canAccessZone(id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this zone" };
  }

  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Zone not found" };
  }

  return { success: true, data: data as Zone };
}

/**
 * Create a new zone
 * Only super admin and ADUN can create zones
 */
export async function createZone(input: CreateZoneInput): Promise<ActionResult<Zone>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Zone name is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to create zones
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create zones" };
  }

  // Check if zone with same name already exists
  const { data: existing } = await supabase
    .from("zones")
    .select("id")
    .eq("name", input.name.trim())
    .single();

  if (existing) {
    return { success: false, error: "A zone with this name already exists" };
  }

  const { data, error } = await supabase
    .from("zones")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/zones");
  return { success: true, data: data as Zone };
}

/**
 * Update an existing zone
 * Only super_admin and ADUN can update zones
 */
export async function updateZone(input: UpdateZoneInput): Promise<ActionResult<Zone>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess, canAccessZone } = await import("@/lib/utils/accessControl");

  // Check if user has permission to update zones
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update zones" };
  }

  // Check if user can access this zone
  const canAccess = await canAccessZone(input.id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to update this zone" };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Zone name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from("zones")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/zones");
  revalidatePath(`/zones/${input.id}`);
  return { success: true, data: data as Zone };
}

/**
 * Delete a zone
 * Only super_admin and ADUN can delete zones
 */
export async function deleteZone(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess, canAccessZone } = await import("@/lib/utils/accessControl");

  // Check if user has permission to delete zones
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete zones" };
  }

  // Check if user can access this zone
  const canAccess = await canAccessZone(id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to delete this zone" };
  }

  // Check if any households are using this zone
  const { data: households } = await supabase
    .from("households")
    .select("id")
    .eq("zone_id", id)
    .limit(1);

  if (households && households.length > 0) {
    return {
      success: false,
      error: "Cannot delete zone: There are households assigned to this zone. Please reassign them first.",
    };
  }

  const { error } = await supabase.from("zones").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/zones");
  return { success: true };
}

/**
 * Get zone statistics (people, children, eligible voters, locality breakdown)
 * Automatically filters by accessible zones
 */
export async function getZoneStatistics(zoneId?: number): Promise<ActionResult<ZoneStatistics[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Get all zones or specific zone
  let zonesQuery = supabase.from("zones").select("id, name");
  
  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    zonesQuery = zonesQuery.in("id", accessibleZoneIds);
  }

  if (zoneId) {
    // Also check if user can access the requested zone
    const { canAccessZone } = await import("@/lib/utils/accessControl");
    if (!await canAccessZone(zoneId)) {
      return { success: false, error: "Access denied: You do not have permission to view this zone" };
    }
    zonesQuery = zonesQuery.eq("id", zoneId);
  }

  const { data: zones, error: zonesError } = await zonesQuery;

  if (zonesError) {
    return { success: false, error: zonesError.message };
  }

  if (!zones || zones.length === 0) {
    return { success: true, data: [] };
  }

  // Get all households in these zones
  const zoneIds = zones.map((z) => z.id);
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, zone_id")
    .in("zone_id", zoneIds);

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map((h) => h.id);

  if (householdIds.length === 0) {
    // Return empty stats for each zone
    return {
      success: true,
      data: zones.map((zone) => ({
        zone_id: zone.id,
        zone_name: zone.name,
        total_people: 0,
        total_children: 0,
        total_eligible_voters: 0,
        locality_breakdown: [],
      })),
    };
  }

  // Get all members from these households
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select("id, household_id, date_of_birth, locality")
    .in("household_id", householdIds);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Import utility functions
  const { isChild, isEligibleToVote } = await import("@/lib/utils/icNumber");

  // Calculate statistics for each zone
  const statistics: ZoneStatistics[] = zones.map((zone) => {
    const zoneHouseholdIds = (households || [])
      .filter((h) => h.zone_id === zone.id)
      .map((h) => h.id);

    const zoneMembers = (members || []).filter((m) => zoneHouseholdIds.includes(m.household_id));

    const totalPeople = zoneMembers.length;
    const totalChildren = zoneMembers.filter((m) => isChild(m.date_of_birth)).length;
    const eligibleVoters = zoneMembers.filter((m) => isEligibleToVote(m.date_of_birth));

    // Locality breakdown for eligible voters
    const localityMap = new Map<string, number>();
    eligibleVoters.forEach((member) => {
      const locality = member.locality || "Not Specified";
      localityMap.set(locality, (localityMap.get(locality) || 0) + 1);
    });

    const localityBreakdown = Array.from(localityMap.entries())
      .map(([locality, count]) => ({ locality, count }))
      .sort((a, b) => b.count - a.count);

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      total_people: totalPeople,
      total_children: totalChildren,
      total_eligible_voters: eligibleVoters.length,
      locality_breakdown: localityBreakdown,
    };
  });

  return { success: true, data: statistics };
}
