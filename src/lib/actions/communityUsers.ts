"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccess, getAccessibleZoneIds } from "@/lib/utils/access-control";

export type CommunityUser = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  ic_number: string | null;
  village_id: number | null;
  zone_id: number | null;
  household_member_id: number | null;
  verification_status: "pending" | "verified" | "rejected";
  verified_by: number | null;
  verified_at: string | null;
  verification_remarks: string | null;
  created_at: string;
  updated_at: string;
  village?: {
    id: number;
    name: string;
  };
  zone?: {
    id: number;
    name: string;
  };
  household_member?: {
    id: number;
    name: string;
    household_id: number;
  };
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all community users (profiles)
 * Zone leaders can only see users in their zone
 * Super admin and ADUN can see all users
 */
export async function getCommunityUsers(options?: {
  status?: "pending" | "verified" | "rejected";
  zoneId?: number;
  villageId?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<CommunityUser>>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const offset = (page - 1) * limit;

  // Get accessible zone IDs
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Build query - Supabase will automatically resolve foreign key relationships
  let query = supabase
    .from("profiles")
    .select(`
      *,
      villages(id, name),
      zones(id, name),
      household_members(id, name, household_id)
    `, { count: "exact" });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      return {
        success: true,
        data: {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  // Apply filters
  if (options?.status) {
    query = query.eq("verification_status", options.status);
  }
  if (options?.zoneId) {
    // Check if user can access this zone
    if (accessibleZoneIds !== null && !accessibleZoneIds.includes(options.zoneId)) {
      return { success: false, error: "Access denied: You do not have permission to view users in this zone" };
    }
    query = query.eq("zone_id", options.zoneId);
  }
  if (options?.villageId) {
    query = query.eq("village_id", options.villageId);
  }
  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,ic_number.ilike.%${options.search}%`
    );
  }

  // Apply pagination
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const total = count || 0;
  const users = (data || []).map((user: any) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    ic_number: user.ic_number,
    village_id: user.village_id,
    zone_id: user.zone_id,
    household_member_id: user.household_member_id,
    verification_status: user.verification_status,
    verified_by: user.verified_by,
    verified_at: user.verified_at,
    verification_remarks: user.verification_remarks,
    created_at: user.created_at,
    updated_at: user.updated_at,
    village: user.villages ? { id: user.villages.id, name: user.villages.name } : undefined,
    zone: user.zones ? { id: user.zones.id, name: user.zones.name } : undefined,
    household_member: user.household_members
      ? {
          id: user.household_members.id,
          name: user.household_members.name,
          household_id: user.household_members.household_id,
        }
      : undefined,
  }));

  return {
    success: true,
    data: {
      data: users as CommunityUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Verify a community user
 * Only zone leaders and above can verify users
 */
export async function verifyCommunityUser(
  userId: number,
  status: "verified" | "rejected",
  remarks?: string
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Authentication required" };
  }

  // Get user to check zone access
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("zone_id")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Check zone access
  if (user.zone_id) {
    const accessibleZoneIds = await getAccessibleZoneIds();
    if (accessibleZoneIds !== null && !accessibleZoneIds.includes(user.zone_id)) {
      return { success: false, error: "Access denied: You do not have permission to verify users in this zone" };
    }
  }

  // Update verification status
  const updateData: any = {
    verification_status: status,
    verified_by: access.staffId,
    verified_at: new Date().toISOString(),
  };

  // Add remarks if provided (especially for revoking/rejecting)
  if (remarks !== undefined) {
    updateData.verification_remarks = remarks.trim() || null;
  } else if (status === "verified") {
    // Clear remarks when verifying
    updateData.verification_remarks = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Link a community user to a household member
 */
export async function linkUserToHouseholdMember(
  userId: number,
  householdMemberId: number
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Authentication required" };
  }

  // Verify household member exists
  const { data: member, error: memberError } = await supabase
    .from("household_members")
    .select("id, household_id")
    .eq("id", householdMemberId)
    .single();

  if (memberError || !member) {
    return { success: false, error: "Household member not found" };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      household_member_id: householdMemberId,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Unlink a community user from household member
 */
export async function unlinkUserFromHouseholdMember(userId: number): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      household_member_id: null,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Search household members for linking to users
 * Returns members with household information
 */
export async function searchHouseholdMembers(options?: {
  search?: string;
  zoneId?: number;
  limit?: number;
}): Promise<ActionResult<Array<{
  id: number;
  name: string;
  ic_number: string | null;
  household_id: number;
  household_name: string;
  household_address: string;
  zone_name: string | null;
}>>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const limit = options?.limit || 50;

  // Get accessible zone IDs
  const accessibleZoneIds = await getAccessibleZoneIds();

  // First, get accessible household IDs based on zone access
  let householdQuery = supabase.from("households").select("id, zone_id");
  
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: [] };
    }
    householdQuery = householdQuery.in("zone_id", accessibleZoneIds);
  }

  if (options?.zoneId) {
    if (accessibleZoneIds !== null && !accessibleZoneIds.includes(options.zoneId)) {
      return { success: false, error: "Access denied: You do not have permission to view members in this zone" };
    }
    householdQuery = householdQuery.eq("zone_id", options.zoneId);
  }

  const { data: households, error: householdsError } = await householdQuery;
  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  const householdIds = (households || []).map((h: any) => h.id);
  if (householdIds.length === 0) {
    return { success: true, data: [] };
  }

  // Get household members
  let membersQuery = supabase
    .from("household_members")
    .select("id, name, ic_number, household_id")
    .in("household_id", householdIds)
    .limit(limit);

  if (options?.search) {
    membersQuery = membersQuery.or(
      `name.ilike.%${options.search}%,ic_number.ilike.%${options.search}%`
    );
  }

  const { data: members, error: membersError } = await membersQuery.order("name", { ascending: true });

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Get household details for the members
  const uniqueHouseholdIds = [...new Set((members || []).map((m: any) => m.household_id))];
  const { data: householdDetails } = await supabase
    .from("households")
    .select("id, head_name, address, zone_id, zones!households_zone_id_fkey(name)")
    .in("id", uniqueHouseholdIds);

  const householdMap = new Map(
    (householdDetails || []).map((h: any) => [
      h.id,
      {
        name: h.head_name,
        address: h.address,
        zone_name: h.zones?.name || null,
      },
    ])
  );

  // Transform the data
  const result = (members || []).map((member: any) => {
    const household = householdMap.get(member.household_id);
    return {
      id: member.id,
      name: member.name,
      ic_number: member.ic_number,
      household_id: member.household_id,
      household_name: household?.name || "Unknown",
      household_address: household?.address || "",
      zone_name: household?.zone_name || null,
    };
  });

  return { success: true, data: result };
}

export type UpdateCommunityUserInput = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  icNumber?: string;
  villageId?: number;
  zoneId?: number;
};

/**
 * Update a community user profile
 * Only zone leaders and above can update users
 * Zone leaders can only update users in their zone
 */
export async function updateCommunityUser(
  input: UpdateCommunityUserInput
): Promise<ActionResult<CommunityUser>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Authentication required" };
  }

  // Get user to check zone access
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("zone_id")
    .eq("id", input.id)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Check zone access
  if (user.zone_id) {
    const accessibleZoneIds = await getAccessibleZoneIds();
    if (accessibleZoneIds !== null && !accessibleZoneIds.includes(user.zone_id)) {
      return { success: false, error: "Access denied: You do not have permission to edit users in this zone" };
    }
  }

  // Validate email format if provided
  if (input.email !== undefined && input.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      return { success: false, error: "Invalid email format" };
    }
  }

  // Validate full name if provided
  if (input.fullName !== undefined && input.fullName.trim() && input.fullName.trim().length < 2) {
    return { success: false, error: "Full name must be at least 2 characters" };
  }

  // Normalize IC number if provided
  let normalizedIc: string | null = null;
  if (input.icNumber !== undefined) {
    if (input.icNumber.trim()) {
      // Remove dashes and spaces
      normalizedIc = input.icNumber.replace(/\D/g, "");
      if (normalizedIc.length < 10 || normalizedIc.length > 12) {
        return { success: false, error: "IC number must be 10-12 digits" };
      }
    } else {
      normalizedIc = null;
    }
  }

  // Check if new email already exists (if changing email)
  if (input.email !== undefined && input.email.trim()) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", input.email.toLowerCase().trim())
      .neq("id", input.id)
      .maybeSingle();

    if (existingProfile) {
      return { success: false, error: "An account with this email already exists" };
    }
  }

  // Check if new IC number already exists (if changing IC)
  if (normalizedIc) {
    const { data: existingIcProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("ic_number", normalizedIc)
      .neq("id", input.id)
      .maybeSingle();

    if (existingIcProfile) {
      return { success: false, error: "An account with this IC number already exists" };
    }
  }

  // Build update object
  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.fullName !== undefined) {
    updates.full_name = input.fullName.trim() || null;
  }
  if (input.email !== undefined) {
    updates.email = input.email.trim() || null;
  }
  if (input.phone !== undefined) {
    updates.phone = input.phone.trim() || null;
  }
  if (input.icNumber !== undefined) {
    updates.ic_number = normalizedIc;
  }
  if (input.villageId !== undefined) {
    updates.village_id = input.villageId || null;
  }
  if (input.zoneId !== undefined) {
    updates.zone_id = input.zoneId || null;
  }

  // Update profile
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", input.id)
    .select(`
      *,
      villages(id, name),
      zones(id, name),
      household_members(id, name, household_id)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Transform the data
  const updatedUser: CommunityUser = {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    ic_number: data.ic_number,
    village_id: data.village_id,
    zone_id: data.zone_id,
    household_member_id: data.household_member_id,
    verification_status: data.verification_status,
    verified_by: data.verified_by,
    verified_at: data.verified_at,
    verification_remarks: data.verification_remarks || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    village: data.villages ? { id: data.villages.id, name: data.villages.name } : undefined,
    zone: data.zones ? { id: data.zones.id, name: data.zones.name } : undefined,
    household_member: data.household_members
      ? {
          id: data.household_members.id,
          name: data.household_members.name,
          household_id: data.household_members.household_id,
        }
      : undefined,
  };

  revalidatePath("/admin/users");
  return { success: true, data: updatedUser };
}
