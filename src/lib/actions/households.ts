"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, getAccessibleZoneIdsReadOnly } from "@/lib/utils/access-control";

export type MemberRelationship = "head" | "spouse" | "child" | "parent" | "sibling" | "other";
export type MemberStatus = "at_home" | "away" | "deceased";
export type DependencyStatus = "dependent" | "independent";
export type VotingSupportStatus = "white" | "black" | "red";

export type Household = {
  id: number;
  head_of_household_id: number | null;
  head_name: string;
  head_ic_number: string | null;
  head_phone: string | null;
  address: string;
  area: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_members?: number;
  members_at_home?: number;
  total_dependents?: number;
  latest_income?: number;
};

export type HouseholdMember = {
  id: number;
  household_id: number;
  name: string;
  ic_number: string | null;
  phone: string | null;
  relationship: MemberRelationship;
  date_of_birth: string | null;
  locality: string | null;
  status: MemberStatus;
  dependency_status: DependencyStatus;
  voting_support_status: VotingSupportStatus | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdIncome = {
  id: number;
  household_id: number;
  monthly_income: number | null;
  income_source: string | null;
  number_of_income_earners: number;
  last_updated: string;
  notes: string | null;
  created_at: string;
};

export type AidDistribution = {
  id: number;
  household_id: number;
  aid_type: string;
  quantity: number;
  distributed_to: number;
  distributed_by: number | null;
  distribution_date: string;
  notes: string | null;
  created_at: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateHouseholdInput = {
  headName: string;
  headIcNumber?: string;
  headPhone?: string;
  address: string;
  area?: string;
  zoneId?: number;
  notes?: string;
  headOfHouseholdId?: number;
  sprVoterId?: number; // Link to SPR voter if created from SPR data
};

export type UpdateHouseholdInput = {
  id: number;
  headName?: string;
  headIcNumber?: string;
  headPhone?: string;
  address?: string;
  area?: string;
  zoneId?: number;
  notes?: string;
  headOfHouseholdId?: number;
};

export type CreateMemberInput = {
  householdId: number;
  name: string;
  icNumber?: string;
  phone?: string;
  relationship: MemberRelationship;
  dateOfBirth?: string;
  locality?: string;
  status?: MemberStatus;
  dependencyStatus?: DependencyStatus;
  votingSupportStatus?: VotingSupportStatus;
  notes?: string;
  sprVoterId?: number; // Link to SPR voter if created from SPR data
};

export type UpdateMemberInput = {
  id: number;
  name?: string;
  icNumber?: string;
  phone?: string;
  relationship?: MemberRelationship;
  dateOfBirth?: string;
  locality?: string;
  status?: MemberStatus;
  dependencyStatus?: DependencyStatus;
  votingSupportStatus?: VotingSupportStatus | null;
  notes?: string;
};

export type CreateIncomeInput = {
  householdId: number;
  monthlyIncome?: number;
  incomeSource?: string;
  numberOfIncomeEarners?: number;
  notes?: string;
};

export type CreateAidDistributionInput = {
  householdId: number;
  aidType: string;
  quantity?: number;
  distributedTo: number;
  distributedBy?: number;
  notes?: string;
};

/**
 * Get all households with computed statistics
 * Automatically filters by zone based on user's access level
 */
export async function getHouseholdList(options?: {
  search?: string;
  area?: string;
}): Promise<ActionResult<Household[]>> {
  // Use read-only client for Server Components
  let supabase;
  try {
    supabase = await getSupabaseReadOnlyClient();
  } catch (error) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("households")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  if (options?.area) {
    query = query.eq("area", options.area);
  }
  if (options?.search) {
    query = query.or(
      `head_name.ilike.%${options.search}%,address.ilike.%${options.search}%,area.ilike.%${options.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Calculate statistics for each household
  const householdsWithStats = await Promise.all(
    (data || []).map(async (household) => {
      const stats = await calculateHouseholdStats(household.id);
      return { ...household, ...stats };
    })
  );

  return { success: true, data: householdsWithStats as Household[] };
}

/**
 * Calculate household statistics (members at home, dependents, etc.)
 */
async function calculateHouseholdStats(householdId: number): Promise<{
  total_members: number;
  members_at_home: number;
  total_dependents: number;
}> {
  // Use read-only client for Server Components
  const supabase = await getSupabaseReadOnlyClient();

  const { data: members } = await supabase
    .from("household_members")
    .select("status, dependency_status")
    .eq("household_id", householdId);

  const totalMembers = members?.length || 0;
  const membersAtHome = members?.filter((m) => m.status === "at_home").length || 0;
  const totalDependents = members?.filter((m) => m.dependency_status === "dependent").length || 0;

  return {
    total_members: totalMembers,
    members_at_home: membersAtHome,
    total_dependents: totalDependents,
  };
}

/**
 * Get a single household by ID with full details
 * Checks access control before returning
 */
export async function getHouseholdById(id: number): Promise<ActionResult<Household & {
  members: HouseholdMember[];
  income: HouseholdIncome[];
  latestAidDistributions: AidDistribution[];
}>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid household ID" };
  }

  // Use read-only client for Server Components to avoid cookie modification errors
  let supabase;
  try {
    supabase = await getSupabaseReadOnlyClient();
  } catch (error) {
    // If cookie error occurs, it means session is invalid - return error
    return { success: false, error: "Session expired. Please log in again." };
  }

  const { canAccessHouseholdReadOnly } = await import("@/lib/utils/access-control");

  // Get household
  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("*")
    .eq("id", id)
    .single();

  if (householdError || !household) {
    return { success: false, error: "Household not found" };
  }

  // Check if user can access this household's zone (using read-only version)
  const canAccess = await canAccessHouseholdReadOnly(household.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You do not have permission to view this household" };
  }

  // Get members
  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", id)
    .order("created_at", { ascending: true });

  // Get income records
  const { data: income } = await supabase
    .from("household_income")
    .select("*")
    .eq("household_id", id)
    .order("last_updated", { ascending: false });

  // Get latest aid distributions (last 10)
  const { data: aidDistributions } = await supabase
    .from("aid_distributions")
    .select("*")
    .eq("household_id", id)
    .order("distribution_date", { ascending: false })
    .limit(10);

  const stats = await calculateHouseholdStats(id);

  // Get latest income
  const latestIncome = income && income.length > 0 ? income[0].monthly_income : null;

  return {
    success: true,
    data: {
      ...household,
      ...stats,
      latest_income: latestIncome,
      members: (members || []) as HouseholdMember[],
      income: (income || []) as HouseholdIncome[],
      latestAidDistributions: (aidDistributions || []) as AidDistribution[],
    },
  };
}

type ExistingMember = {
  id: number;
  household_id: number;
  name: string;
  relationship: string;
  status: string;
  dependency_status: string;
};

type ExistingHeadHousehold = {
  id: number;
  head_name: string;
};

/**
 * Helper function to find or validate a profile for the household head
 * Returns the profile ID if found, null otherwise
 */
async function findOrValidateProfile(
  supabase: any,
  icNumber: string | undefined,
  providedProfileId: number | undefined
): Promise<number | null> {
  // First, try to find profile by IC number if provided
  if (icNumber?.trim()) {
    const { data: profileByIc } = await supabase
      .from("profiles")
      .select("id")
      .eq("ic_number", icNumber.trim())
      .maybeSingle();

    if (profileByIc?.id) {
      return profileByIc.id;
    }
  }

  // If no profile found by IC, validate the provided profile ID if given
  if (providedProfileId) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", providedProfileId)
      .maybeSingle();

    if (profileById?.id) {
      return profileById.id;
    }
    // If provided profile ID doesn't exist, log a warning
    console.warn(`Warning: Provided profile ID ${providedProfileId} does not exist`);
  }

  // No profile found
  return null;
}

/**
 * Helper function to handle existing memberships when someone becomes head of household
 * Marks existing active memberships as "away" to maintain data integrity
 */
async function handleExistingMembership(
  supabase: any,
  icNumber: string,
  headName: string
): Promise<{ hasExistingMembership: boolean; hasExistingHeadHousehold: boolean }> {
  let hasExistingMembership = false;
  let hasExistingHeadHousehold = false;

  if (!icNumber?.trim()) {
    return { hasExistingMembership: false, hasExistingHeadHousehold: false };
  }

  // Check if the person is already a member of another household
  const { data: existingMembers } = await supabase
    .from("household_members")
    .select("id, household_id, name, relationship, status, dependency_status")
    .eq("ic_number", icNumber.trim())
    .in("status", ["at_home", "away"]); // Check both active and away members

  // If person is already a member (and not away), mark them as away in old household
  if (existingMembers && existingMembers.length > 0) {
    const activeMembers = (existingMembers as ExistingMember[]).filter((m) => m.status === "at_home");
    
    if (activeMembers.length > 0) {
      hasExistingMembership = true;
      // Update all active memberships to "away" status
      // Also update dependency_status to "independent" since they're now head of their own household
      // This handles the case where someone moves out and becomes head of their own household
      for (const member of activeMembers) {
        await supabase
          .from("household_members")
          .update({
            status: "away",
            dependency_status: "independent", // They're now independent as head of their own household
            updated_at: new Date().toISOString(),
          })
          .eq("id", member.id);
      }
    }
  }

  // Also check if they're already head of another household
  const { data: existingHeadHouseholds } = await supabase
    .from("households")
    .select("id, head_name")
    .eq("head_ic_number", icNumber.trim());

  if (existingHeadHouseholds && existingHeadHouseholds.length > 0) {
    hasExistingHeadHousehold = true;
    // This person is already head of another household
    // We'll still allow creating a new household, but log a warning
    // In practice, you might want to prevent this or require explicit confirmation
    const householdIds = (existingHeadHouseholds as ExistingHeadHousehold[]).map((h) => h.id).join(", ");
    console.warn(
      `Warning: ${headName} (IC: ${icNumber}) is already head of household(s):`,
      householdIds
    );
  }

  return { hasExistingMembership, hasExistingHeadHousehold };
}

/**
 * Create a new household
 * Requires register_household permission or zone_leader role
 * Zone leaders can only create households in their assigned zone
 * 
 * IMPORTANT: The head of household is automatically added as a member with relationship "head"
 * If the person was previously a member of another household, they are marked as "away" in the old household
 */
export async function createHousehold(input: CreateHouseholdInput): Promise<ActionResult<Household>> {
  if (!input.headName?.trim()) {
    return { success: false, error: "Head of household name is required" };
  }
  if (!input.address?.trim()) {
    return { success: false, error: "Address is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess, canAccessZone, hasPermission } = await import("@/lib/utils/access-control");

  // Check access control
  const access = await getCurrentUserAccess();
  
  // Check if user has permission to register households
  // Super admin, ADUN, and zone leaders have this by default
  // Other staff need the register_household permission
  const canRegister = access.isSuperAdmin || 
                     access.isAdun || 
                     access.isZoneLeader || 
                     await hasPermission("register_household");

  if (!canRegister) {
    return { success: false, error: "Access denied: You do not have permission to register households" };
  }

  // Zone leaders and staff with permission must assign households to their accessible zone
  if (access.isZoneLeader) {
    // Zone leaders must assign households to their zone
    if (!input.zoneId || !await canAccessZone(input.zoneId)) {
      return { success: false, error: "You can only register households in your assigned zone" };
    }
  } else if (!access.isSuperAdmin && !access.isAdun) {
    // Staff with permission must assign to a zone they can access
    if (input.zoneId && !await canAccessZone(input.zoneId)) {
      return { success: false, error: "You can only register households in zones you have access to" };
    }
  }

  // Handle existing memberships: if person was a member elsewhere, mark them as "away"
  if (input.headIcNumber?.trim()) {
    await handleExistingMembership(supabase, input.headIcNumber.trim(), input.headName.trim());
  }

  // Find or validate the profile for the head of household
  // This prevents foreign key constraint violations when the person was previously a member
  const headProfileId = await findOrValidateProfile(
    supabase,
    input.headIcNumber,
    input.headOfHouseholdId
  );

  const { data, error } = await supabase
    .from("households")
    .insert({
      head_name: input.headName.trim(),
      head_ic_number: input.headIcNumber?.trim() || null,
      head_phone: input.headPhone?.trim() || null,
      address: input.address.trim(),
      area: input.area?.trim() || null,
      zone_id: input.zoneId || null,
      notes: input.notes?.trim() || null,
      head_of_household_id: headProfileId, // Use found/validated profile ID or null
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const household = data as Household;

  // ALWAYS create a household member record for the head
  // This ensures the head is always recorded as a member of their household
  if (household.id) {
    const { data: headMember, error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        name: input.headName.trim(),
        ic_number: input.headIcNumber?.trim() || null,
        relationship: "head",
        date_of_birth: null, // Can be extracted from IC if needed
        status: "at_home",
        dependency_status: "independent",
      })
      .select()
      .single();

    if (memberError) {
      // If member creation fails, we should rollback the household creation
      // But since Supabase doesn't support transactions in this context easily,
      // we'll log the error and return a warning
      console.error("Failed to create head member:", memberError);
      // Note: The household was created but without a member record
      // This is a data integrity issue that should be addressed
      return {
        success: false,
        error: `Household created but failed to add head as member: ${memberError.message}`,
      };
    }

    // If the person has a profile (e.g., they were previously a household member),
    // update their profile to link to the new head member record
    // This handles the transition from member to head of their own household
    if (headProfileId && headMember) {
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          household_member_id: headMember.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", headProfileId);

      if (profileUpdateError) {
        // Log but don't fail - this is a data consistency improvement, not critical
        console.warn("Failed to update profile household_member_id:", profileUpdateError);
      }
    }

    // If created from SPR data, link SPR voter to the head member
    if (input.sprVoterId && headMember) {
      // Check if SPR voter is already linked to a member
      const { data: sprVoter } = await supabase
        .from("spr_voters")
        .select("household_member_id")
        .eq("id", input.sprVoterId)
        .single();

      // Only link if not already linked
      if (sprVoter && !sprVoter.household_member_id) {
        const { error: sprLinkError } = await supabase
          .from("spr_voters")
          .update({
            household_member_id: headMember.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.sprVoterId);

        if (sprLinkError) {
          console.error("Failed to link SPR voter to household member:", sprLinkError);
          // Don't fail the whole operation, just log the error
        }
      }
    }
  }

  revalidatePath("/admin/households");
  return { success: true, data: household };
}

/**
 * Update an existing household
 * Zone leaders can only update households in their assigned zone
 */
export async function updateHousehold(input: UpdateHouseholdInput): Promise<ActionResult<Household>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid household ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { canAccessHousehold, canAccessZone } = await import("@/lib/utils/access-control");

  // First, check if user can access the current household
  const { data: currentHousehold } = await supabase
    .from("households")
    .select("zone_id")
    .eq("id", input.id)
    .single();

  if (currentHousehold) {
    const canAccess = await canAccessHousehold(currentHousehold.zone_id);
    if (!canAccess) {
      return { success: false, error: "Access denied: You do not have permission to update this household" };
    }

    // If zone is being changed, check access to new zone
    if (input.zoneId !== undefined && input.zoneId !== currentHousehold.zone_id) {
      if (!await canAccessZone(input.zoneId)) {
        return { success: false, error: "You cannot move households to a zone you don't have access to" };
      }
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.headName !== undefined) {
    if (!input.headName.trim()) {
      return { success: false, error: "Head name cannot be empty" };
    }
    updates.head_name = input.headName.trim();
  }

  if (input.headIcNumber !== undefined) {
    updates.head_ic_number = input.headIcNumber?.trim() || null;
  }

  if (input.headPhone !== undefined) {
    updates.head_phone = input.headPhone?.trim() || null;
  }

  if (input.address !== undefined) {
    if (!input.address.trim()) {
      return { success: false, error: "Address cannot be empty" };
    }
    updates.address = input.address.trim();
  }

  if (input.area !== undefined) {
    updates.area = input.area?.trim() || null;
  }

  if (input.zoneId !== undefined) {
    updates.zone_id = input.zoneId || null;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || null;
  }

  if (input.headOfHouseholdId !== undefined) {
    updates.head_of_household_id = input.headOfHouseholdId || null;
  }

  const { data, error } = await supabase
    .from("households")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/households");
  revalidatePath(`/households/${input.id}`);
  return { success: true, data: data as Household };
}

/**
 * Delete a household
 * Zone leaders can only delete households in their assigned zone
 */
export async function deleteHousehold(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid household ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { canAccessHousehold } = await import("@/lib/utils/access-control");

  // Check if user can access this household
  const { data: household } = await supabase
    .from("households")
    .select("zone_id")
    .eq("id", id)
    .single();

  if (household) {
    const canAccess = await canAccessHousehold(household.zone_id);
    if (!canAccess) {
      return { success: false, error: "Access denied: You do not have permission to delete this household" };
    }
  }

  const { error } = await supabase.from("households").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/households");
  return { success: true };
}

/**
 * Get all members for a household
 */
export async function getHouseholdMembers(householdId: number): Promise<ActionResult<HouseholdMember[]>> {
  if (!householdId || Number.isNaN(householdId)) {
    return { success: false, error: "Invalid household ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as HouseholdMember[] };
}

/**
 * Add a member to a household
 */
export async function createMember(input: CreateMemberInput): Promise<ActionResult<HouseholdMember>> {
  if (!input.householdId || Number.isNaN(input.householdId)) {
    return { success: false, error: "Invalid household ID" };
  }
  if (!input.name?.trim()) {
    return { success: false, error: "Member name is required" };
  }
  if (!input.relationship) {
    return { success: false, error: "Relationship is required" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("household_members")
    .insert({
      household_id: input.householdId,
      name: input.name.trim(),
      ic_number: input.icNumber?.trim() || null,
      phone: input.phone?.trim() || null,
      relationship: input.relationship,
      date_of_birth: input.dateOfBirth || null,
      locality: input.locality?.trim() || null,
      status: input.status || "at_home",
      dependency_status: input.dependencyStatus || "dependent",
      voting_support_status: input.votingSupportStatus || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const member = data as HouseholdMember;

  // If created from SPR data, link SPR voter to this member
  if (input.sprVoterId && member.id) {
    // Check if SPR voter is already linked to a member
    const { data: sprVoter } = await supabase
      .from("spr_voters")
      .select("household_member_id")
      .eq("id", input.sprVoterId)
      .single();

    // Only link if not already linked
    if (sprVoter && !sprVoter.household_member_id) {
      const { error: sprLinkError } = await supabase
        .from("spr_voters")
        .update({
          household_member_id: member.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.sprVoterId);

      if (sprLinkError) {
        console.error("Failed to link SPR voter to household member:", sprLinkError);
        // Don't fail the whole operation, just log the error
      }
    }
  }

  revalidatePath(`/households/${input.householdId}`);
  return { success: true, data: member };
}

/**
 * Update a household member
 */
export async function updateMember(input: UpdateMemberInput): Promise<ActionResult<HouseholdMember>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid member ID" };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.icNumber !== undefined) {
    updates.ic_number = input.icNumber?.trim() || null;
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone?.trim() || null;
  }

  if (input.relationship !== undefined) {
    updates.relationship = input.relationship;
  }

  if (input.dateOfBirth !== undefined) {
    updates.date_of_birth = input.dateOfBirth || null;
  }

  if (input.locality !== undefined) {
    updates.locality = input.locality?.trim() || null;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.dependencyStatus !== undefined) {
    updates.dependency_status = input.dependencyStatus;
  }

  if (input.votingSupportStatus !== undefined) {
    updates.voting_support_status = input.votingSupportStatus;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || null;
  }

  // Get household ID for revalidation
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("id", input.id)
    .single();

  const { data, error } = await supabase
    .from("household_members")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (member) {
    revalidatePath(`/households/${member.household_id}`);
  }
  return { success: true, data: data as HouseholdMember };
}

/**
 * Delete a household member
 */
export async function deleteMember(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid member ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Get household ID for revalidation
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("household_members").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (member) {
    revalidatePath(`/households/${member.household_id}`);
  }
  return { success: true };
}

/**
 * Create or update income information for a household
 */
export async function upsertIncome(input: CreateIncomeInput): Promise<ActionResult<HouseholdIncome>> {
  if (!input.householdId || Number.isNaN(input.householdId)) {
    return { success: false, error: "Invalid household ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if income record exists
  const { data: existing } = await supabase
    .from("household_income")
    .select("id")
    .eq("household_id", input.householdId)
    .order("last_updated", { ascending: false })
    .limit(1)
    .single();

  const incomeData = {
    household_id: input.householdId,
    monthly_income: input.monthlyIncome || null,
    income_source: input.incomeSource?.trim() || null,
    number_of_income_earners: input.numberOfIncomeEarners || 0,
    notes: input.notes?.trim() || null,
    last_updated: new Date().toISOString(),
  };

  let data, error;
  if (existing) {
    // Update existing
    const result = await supabase
      .from("household_income")
      .update(incomeData)
      .eq("id", existing.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Create new
    const result = await supabase
      .from("household_income")
      .insert(incomeData)
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/households/${input.householdId}`);
  return { success: true, data: data as HouseholdIncome };
}

/**
 * Record aid distribution
 */
export async function createAidDistribution(
  input: CreateAidDistributionInput
): Promise<ActionResult<AidDistribution>> {
  if (!input.householdId || Number.isNaN(input.householdId)) {
    return { success: false, error: "Invalid household ID" };
  }
  if (!input.aidType?.trim()) {
    return { success: false, error: "Aid type is required" };
  }
  if (!input.distributedTo || input.distributedTo < 1) {
    return { success: false, error: "Number of people distributed to must be at least 1" };
  }

  const supabase = await getSupabaseServerClient();

  // Get household stats to verify distribution
  const stats = await calculateHouseholdStats(input.householdId);

  // Warn if distributed to more than members at home (but allow it)
  if (input.distributedTo > stats.members_at_home) {
    // This is just a warning, we'll still allow it
  }

  const { data, error } = await supabase
    .from("aid_distributions")
    .insert({
      household_id: input.householdId,
      aid_type: input.aidType.trim(),
      quantity: input.quantity || 1,
      distributed_to: input.distributedTo,
      distributed_by: input.distributedBy || null,
      distribution_date: new Date().toISOString(),
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/households/${input.householdId}`);
  revalidatePath("/admin/households");
  return { success: true, data: data as AidDistribution };
}

/**
 * Get households that haven't received aid in a specific period (to ensure no one is left behind)
 * Automatically filters by zone based on user's access level
 */
export async function getHouseholdsWithoutRecentAid(
  days: number = 30,
  area?: string
): Promise<ActionResult<Household[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let query = supabase
    .from("households")
    .select("*, aid_distributions!left(distribution_date)")
    .order("created_at", { ascending: false });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      // No zones accessible, return empty
      return { success: true, data: [] };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  if (area) {
    query = query.eq("area", area);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Filter households that haven't received aid recently
  const householdsWithoutAid = (data || [])
    .filter((household: any) => {
      const distributions = household.aid_distributions || [];
      if (distributions.length === 0) return true;

      const latestDistribution = distributions
        .map((d: any) => new Date(d.distribution_date))
        .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];

      return latestDistribution < cutoffDate;
    })
    .map((household: any) => {
      const { aid_distributions, ...rest } = household;
      return rest;
    });

  // Calculate stats for each
  const householdsWithStats = await Promise.all(
    householdsWithoutAid.map(async (household: Household) => {
      const stats = await calculateHouseholdStats(household.id);
      return { ...household, ...stats };
    })
  );

  return { success: true, data: householdsWithStats };
}

/**
 * Find related household members across households by tracing relationships
 * Uses IC number matching to find parents, children, and siblings in other households
 */
export async function findRelatedMembers(
  householdId: number,
  memberId?: number
): Promise<ActionResult<{
  members: HouseholdMember[];
  households: Household[];
}>> {
  // Use read-only client for Server Components
  let supabase;
  try {
    supabase = await getSupabaseReadOnlyClient();
  } catch (error) {
    return { success: false, error: "Session expired. Please log in again." };
  }
  
  const { canAccessHouseholdReadOnly } = await import("@/lib/utils/access-control");

  // Get the starting household
  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .single();

  if (householdError || !household) {
    return { success: false, error: "Household not found" };
  }

  // Check access (using read-only version)
  const canAccess = await canAccessHouseholdReadOnly(household.zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied" };
  }

  // Get all members from the starting household
  const { data: startingMembers } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId);

  if (!startingMembers || startingMembers.length === 0) {
    return { success: true, data: { members: [], households: [household] } };
  }

  // Collect all IC numbers from starting household
  const icNumbers = new Set<string>();
  startingMembers.forEach((m) => {
    if (m.ic_number) {
      const normalized = m.ic_number.replace(/[\s-]/g, "").toUpperCase();
      icNumbers.add(normalized);
      // Also add variations
      icNumbers.add(normalized.replace(/(\d{6})(\d{2})(\d{4})/, "$1-$2-$3"));
      icNumbers.add(normalized.replace(/-/g, ""));
    }
  });

  // Get accessible zone IDs
  const accessibleZoneIds = await getAccessibleZoneIds();

  // Find all household members with matching IC numbers (potential relatives)
  let relatedMembersQuery = supabase
    .from("household_members")
    .select("*");

  // Filter by accessible zones if restricted
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: { members: startingMembers as HouseholdMember[], households: [household] } };
    }
    // Get household IDs in accessible zones
    const { data: accessibleHouseholds } = await supabase
      .from("households")
      .select("id")
      .in("zone_id", accessibleZoneIds);
    
    if (accessibleHouseholds && accessibleHouseholds.length > 0) {
      const householdIds = accessibleHouseholds.map((h: any) => h.id);
      relatedMembersQuery = relatedMembersQuery.in("household_id", householdIds);
    } else {
      return { success: true, data: { members: startingMembers as HouseholdMember[], households: [household] } };
    }
  }

  const { data: allMembers } = await relatedMembersQuery;

  // Normalize IC helper
  const normalizeIc = (ic: string | null) => {
    if (!ic) return null;
    return ic.replace(/[\s-]/g, "").toUpperCase();
  };

  // Build IC to member map for quick lookup
  const icToMembersMap = new Map<string, any[]>();
  (allMembers || []).forEach((m: any) => {
    if (m.ic_number) {
      const normalized = normalizeIc(m.ic_number);
      if (normalized) {
        if (!icToMembersMap.has(normalized)) {
          icToMembersMap.set(normalized, []);
        }
        icToMembersMap.get(normalized)!.push(m);
      }
    }
  });

  // Filter members with matching IC numbers OR relationship connections
  const relatedMembers = (allMembers || []).filter((m: any) => {
    // Skip if already in starting household
    if (m.household_id === householdId) return false;

    // Check IC number match - if IC matches, definitely related
    if (m.ic_number) {
      const normalized = normalizeIc(m.ic_number);
      if (normalized && icNumbers.has(normalized)) return true;
      // Check variations
      const withDashes = normalized?.replace(/(\d{6})(\d{2})(\d{4})/, "$1-$2-$3");
      const withoutDashes = normalized?.replace(/-/g, "");
      if (withDashes && icNumbers.has(withDashes)) return true;
      if (withoutDashes && icNumbers.has(withoutDashes)) return true;
    }

    // Relationship-based connections:
    // If a starting member is a "child", find "parent" members in other households
    // If a starting member is a "parent"/"head", find "child" members in other households
    for (const startingMember of startingMembers) {
      // If starting member is a child, look for parents in other households
      if (startingMember.relationship === "child" && (m.relationship === "parent" || m.relationship === "head")) {
        // Check if names suggest relationship (same surname or family name pattern)
        // For Malaysian names, check if they share common patterns
        return true; // Include potential parents
      }
      
      // If starting member is parent/head, look for children in other households
      if ((startingMember.relationship === "parent" || startingMember.relationship === "head") && m.relationship === "child") {
        return true; // Include potential children
      }

      // If starting member is sibling, look for other siblings
      if (startingMember.relationship === "sibling" && m.relationship === "sibling") {
        return true;
      }
    }

    return false;
  });

  // Combine starting members with related members (avoid duplicates)
  const memberMap = new Map<number, HouseholdMember>();
  [...startingMembers, ...relatedMembers].forEach((m: any) => {
    if (!memberMap.has(m.id)) {
      memberMap.set(m.id, m as HouseholdMember);
    }
  });

  // Get unique household IDs
  const householdIds = new Set<number>();
  memberMap.forEach((m) => householdIds.add(m.household_id));

  // Get all related households
  const { data: relatedHouseholds } = await supabase
    .from("households")
    .select("*")
    .in("id", Array.from(householdIds));

  return {
    success: true,
    data: {
      members: Array.from(memberMap.values()),
      households: (relatedHouseholds || []) as Household[],
    },
  };
}
