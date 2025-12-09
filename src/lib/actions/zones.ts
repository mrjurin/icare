"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone, getAccessibleZoneIdsReadOnly } from "@/lib/utils/access-control";

export type Zone = {
  id: number;
  dun_id: number;
  name: string;
  description: string | null;
  polling_station_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ZoneWithPollingStation = Zone & {
  polling_station?: {
    id: number;
    name: string;
    code: string | null;
    locality_name: string | null;
  } | null;
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
  dunId: number;
  name: string;
  description?: string;
};

export type UpdateZoneInput = {
  id: number;
  dunId?: number;
  name?: string;
  description?: string;
};

/**
 * Get all zones (public - no authentication required)
 * Used for public forms like membership applications
 */
export async function getZonesPublic(): Promise<ActionResult<Zone[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Zone[] };
}

/**
 * Get all zones accessible to the current user (read-only version for Server Components)
 * Zone leaders only see their assigned zone
 * Super admin and ADUN see all zones
 * Use this in Server Components to avoid cookie modification errors
 */
export async function getZonesReadOnly(): Promise<ActionResult<Zone[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIdsReadOnly();

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
 * Get all zones accessible to the current user
 * Zone leaders only see their assigned zone
 * Super admin and ADUN see all zones
 * Use this in Server Actions where cookie modification is allowed
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
export async function getZoneById(id: number): Promise<ActionResult<ZoneWithPollingStation>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if user can access this zone
  const canAccess = await canAccessZone(id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this zone" };
  }

  // Try to select with polling station join, but handle case where column might not exist yet
  let query = supabase
    .from("zones")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await query;

  if (error || !data) {
    return { success: false, error: "Zone not found" };
  }

  const zone = data as any;
  
  // If polling_station_id exists and is not null, fetch the polling station details
  let pollingStation = null;
  if (zone.polling_station_id) {
    const { data: psData } = await supabase
      .from("polling_stations")
      .select("id, name, code, localities(name)")
      .eq("id", zone.polling_station_id)
      .single();
    
    if (psData) {
      pollingStation = {
        id: psData.id,
        name: psData.name,
        code: psData.code,
        locality_name: (psData as any).localities?.name || null,
      };
    }
  }

  const result: ZoneWithPollingStation = {
    id: zone.id,
    dun_id: zone.dun_id,
    name: zone.name,
    description: zone.description,
    polling_station_id: zone.polling_station_id || null,
    created_at: zone.created_at,
    updated_at: zone.updated_at,
    polling_station: pollingStation,
  };

  return { success: true, data: result };
}

/**
 * Create a new zone
 * Only super admin and ADUN can create zones
 */
export async function createZone(input: CreateZoneInput): Promise<ActionResult<Zone>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Zone name is required" };
  }

  if (!input.dunId || Number.isNaN(input.dunId)) {
    return { success: false, error: "DUN is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/access-control");

  // Check if user has permission to create zones
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create zones" };
  }

  // Verify DUN exists
  const { data: dun } = await supabase
    .from("duns")
    .select("id")
    .eq("id", input.dunId)
    .single();

  if (!dun) {
    return { success: false, error: "Selected DUN does not exist" };
  }

  // Check if zone with same name already exists in this DUN
  const { data: existing } = await supabase
    .from("zones")
    .select("id")
    .eq("name", input.name.trim())
    .eq("dun_id", input.dunId)
    .single();

  if (existing) {
    return { success: false, error: "A zone with this name already exists in this DUN" };
  }

  const { data, error } = await supabase
    .from("zones")
    .insert({
      dun_id: input.dunId,
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
  const { getCurrentUserAccess, canAccessZone } = await import("@/lib/utils/access-control");

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

  if (input.dunId !== undefined) {
    // Verify DUN exists
    const { data: dun } = await supabase
      .from("duns")
      .select("id")
      .eq("id", input.dunId)
      .single();

    if (!dun) {
      return { success: false, error: "Selected DUN does not exist" };
    }
    updates.dun_id = input.dunId;
  }

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
  const { getCurrentUserAccess, canAccessZone } = await import("@/lib/utils/access-control");

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
    const { canAccessZone } = await import("@/lib/utils/access-control");
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
  const { isChild, isEligibleToVote } = await import("@/lib/utils/ic-number");

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

/**
 * Link a polling station to a zone
 * Only super admin and ADUN can link polling stations
 */
export async function linkPollingStationToZone(
  zoneId: number,
  pollingStationId: number | null
): Promise<ActionResult<Zone>> {
  if (!zoneId || Number.isNaN(zoneId)) {
    return { success: false, error: "Invalid zone ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess, canAccessZone } = await import("@/lib/utils/access-control");

  // Check if user has permission to update zones
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can link polling stations" };
  }

  // Check if user can access this zone
  const canAccess = await canAccessZone(zoneId);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to update this zone" };
  }

  // If pollingStationId is provided, verify it exists
  if (pollingStationId !== null) {
    const { data: pollingStation, error: psError } = await supabase
      .from("polling_stations")
      .select("id")
      .eq("id", pollingStationId)
      .single();

    if (psError || !pollingStation) {
      return { success: false, error: "Polling station not found" };
    }
  }

  const { data, error } = await supabase
    .from("zones")
    .update({
      polling_station_id: pollingStationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", zoneId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/zones");
  revalidatePath(`/admin/zones/${zoneId}`);
  return { success: true, data: data as Zone };
}
