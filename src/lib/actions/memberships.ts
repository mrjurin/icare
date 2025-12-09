"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleZoneIds, canAccessZone, getAccessibleZoneIdsReadOnly, getCurrentUserAccess } from "@/lib/utils/access-control";

export type MembershipApplication = {
  id: number;
  zone_id: number;
  cawangan_id: number;
  full_name: string;
  ic_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  race: string | null;
  religion: string | null;
  photo_url: string | null;
  was_previous_member: boolean;
  zone_reviewed_by: number | null;
  zone_reviewed_at: string | null;
  zone_supports: boolean | null;
  zone_remarks: string | null;
  membership_number: string | null;
  approved_by: number | null;
  approved_at: string | null;
  status: "draft" | "submitted" | "zone_reviewed" | "approved" | "rejected";
  admin_remarks: string | null;
  created_at: string;
  updated_at: string;
  zone?: {
    id: number;
    name: string;
  };
  cawangan?: {
    id: number;
    name: string;
  };
  previous_parties?: Array<{
    id: number;
    party_name: string;
    from_date: string | null;
    to_date: string | null;
  }>;
};

export type Membership = {
  id: number;
  application_id: number | null;
  membership_number: string;
  zone_id: number;
  cawangan_id: number;
  full_name: string;
  ic_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  race: string | null;
  religion: string | null;
  photo_url: string | null;
  joined_date: string;
  status: string;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
  zone?: {
    id: number;
    name: string;
  };
  cawangan?: {
    id: number;
    name: string;
  };
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateMembershipApplicationInput = {
  zoneId: number;
  cawanganId: number;
  fullName: string;
  icNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  race?: string;
  religion?: string;
  photoUrl?: string;
  wasPreviousMember: boolean;
  previousParties?: Array<{
    partyName: string;
    fromDate?: string;
    toDate?: string;
  }>;
};

export type UpdateMembershipApplicationInput = {
  id: number;
  zoneId?: number;
  cawanganId?: number;
  fullName?: string;
  icNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  race?: string;
  religion?: string;
  photoUrl?: string;
  wasPreviousMember?: boolean;
  previousParties?: Array<{
    id?: number;
    partyName: string;
    fromDate?: string;
    toDate?: string;
  }>;
};

export type ZoneReviewInput = {
  applicationId: number;
  supports: boolean;
  remarks?: string;
};

export type AdminApprovalInput = {
  applicationId: number;
  remarks?: string;
};

/**
 * Generate the next membership number in format M{YYYY}{MM}{######}
 * Format: M202501000001 (M + Year + Month + 6-digit running number)
 * This function is used internally by the server action
 */
async function generateMembershipNumber(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `M${year}${month}`;

  // Find the highest membership number for this month
  const { data: existingMemberships } = await supabase
    .from("memberships")
    .select("membership_number")
    .like("membership_number", `${prefix}%`)
    .order("membership_number", { ascending: false })
    .limit(1);

  let nextSequence = 1;

  if (existingMemberships && existingMemberships.length > 0 && existingMemberships[0]?.membership_number) {
    const lastNumber = existingMemberships[0].membership_number;
    // Extract the sequence part (last 6 digits)
    const lastSequence = parseInt(lastNumber.slice(-6), 10);
    if (!isNaN(lastSequence) && lastSequence > 0) {
      nextSequence = lastSequence + 1;
    }
  }

  // Format: M + YYYY + MM + 6-digit sequence
  const sequence = String(nextSequence).padStart(6, "0");
  return `${prefix}${sequence}`;
}

/**
 * Preview the next membership number that will be generated (for display purposes)
 * This is a public function that can be called from the client
 */
export async function previewNextMembershipNumber(): Promise<ActionResult<string>> {
  try {
    const number = await generateMembershipNumber();
    return { success: true, data: number };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate membership number" };
  }
}

/**
 * Create a new membership application (public - no auth required)
 */
export async function createMembershipApplication(
  input: CreateMembershipApplicationInput
): Promise<ActionResult<MembershipApplication>> {
  if (!input.fullName?.trim()) {
    return { success: false, error: "Full name is required" };
  }

  if (!input.icNumber?.trim()) {
    return { success: false, error: "IC number is required" };
  }

  if (!input.zoneId || Number.isNaN(input.zoneId)) {
    return { success: false, error: "Zone is required" };
  }

  if (!input.cawanganId || Number.isNaN(input.cawanganId)) {
    return { success: false, error: "Cawangan is required" };
  }

  const supabase = await getSupabaseServerClient();

  // Verify zone and cawangan exist and are linked
  const { data: cawanganData } = await supabase
    .from("cawangan")
    .select("id, zone_id, is_active")
    .eq("id", input.cawanganId)
    .single();

  if (!cawanganData) {
    return { success: false, error: "Selected cawangan does not exist" };
  }

  if (!cawanganData.is_active) {
    return { success: false, error: "Selected cawangan is not active" };
  }

  if (cawanganData.zone_id !== input.zoneId) {
    return { success: false, error: "Cawangan does not belong to the selected zone" };
  }

  // Check if application with same IC number already exists
  const { data: existing } = await supabase
    .from("membership_applications")
    .select("id")
    .eq("ic_number", input.icNumber.trim())
    .in("status", ["draft", "submitted", "zone_reviewed"])
    .single();

  if (existing) {
    return { success: false, error: "An application with this IC number already exists" };
  }

  // Create application
  const { data: application, error: appError } = await supabase
    .from("membership_applications")
    .insert({
      zone_id: input.zoneId,
      cawangan_id: input.cawanganId,
      full_name: input.fullName.trim(),
      ic_number: input.icNumber.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      race: input.race?.trim() || null,
      religion: input.religion?.trim() || null,
      photo_url: input.photoUrl || null,
      was_previous_member: input.wasPreviousMember || false,
      status: "submitted", // Auto-submit when created
    })
    .select("*")
    .single();

  if (appError || !application) {
    return { success: false, error: appError?.message || "Failed to create application" };
  }

  // Add previous parties if provided
  if (input.previousParties && input.previousParties.length > 0) {
    const previousPartiesData = input.previousParties.map((party) => ({
      application_id: application.id,
      party_name: party.partyName.trim(),
      from_date: party.fromDate || null,
      to_date: party.toDate || null,
    }));

    const { error: partiesError } = await supabase
      .from("membership_application_previous_parties")
      .insert(previousPartiesData);

    if (partiesError) {
      // Log error but don't fail the application
      console.error("Failed to insert previous parties:", partiesError);
    }
  }

  revalidatePath("/membership/apply");
  return { success: true, data: application as MembershipApplication };
}

/**
 * Get membership applications (with access control)
 */
export async function getMembershipApplications(
  status?: "draft" | "submitted" | "zone_reviewed" | "approved" | "rejected",
  zoneId?: number
): Promise<ActionResult<MembershipApplication[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("membership_applications")
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name),
      previous_parties:membership_application_previous_parties(*)
    `)
    .order("created_at", { ascending: false });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    // User is restricted to specific zones (zone leader)
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: [] };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }

  // Filter by zone if provided
  if (zoneId) {
    if (accessibleZoneIds !== null) {
      const canAccess = await canAccessZone(zoneId);
      if (!canAccess) {
        return { success: false, error: "Access denied" };
      }
    }
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as MembershipApplication[] };
}

/**
 * Get a single membership application by ID
 */
export async function getMembershipApplicationById(
  id: number
): Promise<ActionResult<MembershipApplication>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid application ID" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("membership_applications")
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name),
      previous_parties:membership_application_previous_parties(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Application not found" };
  }

  // Check access control
  const canAccess = await canAccessZone((data as any).zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied" };
  }

  return { success: true, data: data as MembershipApplication };
}

/**
 * Zone office review - staff can support or reject application
 */
export async function reviewMembershipApplicationByZone(
  input: ZoneReviewInput
): Promise<ActionResult<MembershipApplication>> {
  const access = await getCurrentUserAccess();

  // Only zone leaders and above can review
  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    return { success: false, error: "Access denied: Only zone staff can review applications" };
  }

  const supabase = await getSupabaseServerClient();

  // Get application to check zone access
  const { data: application } = await supabase
    .from("membership_applications")
    .select("zone_id, status")
    .eq("id", input.applicationId)
    .single();

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  // Check if user can access this zone
  const canAccess = await canAccessZone((application as any).zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied: You cannot review applications in this zone" };
  }

  // Check if application is in correct status
  if ((application as any).status !== "submitted") {
    return { success: false, error: "Application must be in 'submitted' status to be reviewed" };
  }

  // Get current user staff ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: staffData } = await supabase
    .from("staff")
    .select("id")
    .or(`email.eq.${user.email},ic_number.eq.${user.user_metadata?.ic_number || ""}`)
    .single();

  if (!staffData) {
    return { success: false, error: "Staff record not found" };
  }

  // Update application
  const { data, error } = await supabase
    .from("membership_applications")
    .update({
      zone_reviewed_by: staffData.id,
      zone_reviewed_at: new Date().toISOString(),
      zone_supports: input.supports,
      zone_remarks: input.remarks?.trim() || null,
      status: input.supports ? "zone_reviewed" : "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId)
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name),
      previous_parties:membership_application_previous_parties(*)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/memberships");
  revalidatePath(`/admin/memberships/${input.applicationId}`);
  return { success: true, data: data as MembershipApplication };
}

/**
 * Admin approval - generate membership number and approve application
 */
export async function approveMembershipApplication(
  input: AdminApprovalInput
): Promise<ActionResult<Membership>> {
  const access = await getCurrentUserAccess();

  // Only super admin and ADUN can approve
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin can approve applications" };
  }

  const supabase = await getSupabaseServerClient();

  // Get application
  const { data: application } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", input.applicationId)
    .single();

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  // Check if application is in correct status
  if ((application as any).status !== "zone_reviewed") {
    return { success: false, error: "Application must be reviewed by zone staff first" };
  }

  // Check if zone supports
  if (!(application as any).zone_supports) {
    return { success: false, error: "Zone staff did not support this application" };
  }

  // Get current user staff ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: staffData } = await supabase
    .from("staff")
    .select("id")
    .or(`email.eq.${user.email},ic_number.eq.${user.user_metadata?.ic_number || ""}`)
    .single();

  if (!staffData) {
    return { success: false, error: "Staff record not found" };
  }

  // Generate membership number automatically
  let membershipNumber = await generateMembershipNumber();

  // Double-check if the generated number already exists (race condition protection)
  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("id")
    .eq("membership_number", membershipNumber)
    .single();

  if (existingMembership) {
    // Retry with a new number if collision occurs
    const retryNumber = await generateMembershipNumber();
    if (retryNumber === membershipNumber) {
      return { success: false, error: "Failed to generate unique membership number. Please try again." };
    }
    membershipNumber = retryNumber;
  }

  // Create membership with auto-generated number
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      application_id: input.applicationId,
      membership_number: membershipNumber,
      zone_id: (application as any).zone_id,
      cawangan_id: (application as any).cawangan_id,
      full_name: (application as any).full_name,
      ic_number: (application as any).ic_number,
      phone: (application as any).phone,
      email: (application as any).email,
      address: (application as any).address,
      date_of_birth: (application as any).date_of_birth,
      gender: (application as any).gender,
      race: (application as any).race,
      religion: (application as any).religion,
      photo_url: (application as any).photo_url,
      approved_by: staffData.id,
      status: "active",
    })
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name)
    `)
    .single();

  if (membershipError) {
    // If duplicate key error, it means the number was taken between generation and insert
    if (membershipError.code === "23505" || membershipError.message.includes("duplicate")) {
      return { success: false, error: "Membership number collision detected. Please try again." };
    }
    return { success: false, error: membershipError.message };
  }

  // Update application status
  const { error: updateError } = await supabase
    .from("membership_applications")
    .update({
      membership_number: membershipNumber,
      approved_by: staffData.id,
      approved_at: new Date().toISOString(),
      status: "approved",
      admin_remarks: input.remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  if (updateError) {
    // Rollback membership creation
    await supabase.from("memberships").delete().eq("id", (membership as any).id);
    return { success: false, error: updateError.message };
  }

  revalidatePath("/admin/memberships");
  revalidatePath(`/admin/memberships/${input.applicationId}`);
  return { success: true, data: { ...membership, membership_number: membershipNumber } as Membership };
}

/**
 * Reject membership application (admin only)
 */
export async function rejectMembershipApplication(
  applicationId: number,
  remarks?: string
): Promise<ActionResult> {
  const access = await getCurrentUserAccess();

  // Only super admin and ADUN can reject
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin can reject applications" };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("membership_applications")
    .update({
      status: "rejected",
      admin_remarks: remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/memberships");
  revalidatePath(`/admin/memberships/${applicationId}`);
  return { success: true };
}

/**
 * Get all memberships
 */
export async function getMemberships(
  status?: string,
  zoneId?: number
): Promise<ActionResult<Membership[]>> {
  const supabase = await getSupabaseServerClient();

  // Get accessible zone IDs based on user role
  const accessibleZoneIds = await getAccessibleZoneIds();

  let query = supabase
    .from("memberships")
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name)
    `)
    .order("created_at", { ascending: false });

  // Apply zone-based access control
  if (accessibleZoneIds !== null) {
    if (accessibleZoneIds.length === 0) {
      return { success: true, data: [] };
    }
    query = query.in("zone_id", accessibleZoneIds);
  }

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }

  // Filter by zone if provided
  if (zoneId) {
    if (accessibleZoneIds !== null) {
      const canAccess = await canAccessZone(zoneId);
      if (!canAccess) {
        return { success: false, error: "Access denied" };
      }
    }
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Membership[] };
}

/**
 * Get a single membership by ID
 */
export async function getMembershipById(id: number): Promise<ActionResult<Membership>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid membership ID" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("memberships")
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Membership not found" };
  }

  // Check access control
  const canAccess = await canAccessZone((data as any).zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied" };
  }

  return { success: true, data: data as Membership };
}

/**
 * Update membership status
 */
export async function updateMembershipStatus(
  membershipId: number,
  status: "active" | "inactive" | "suspended" | "terminated"
): Promise<ActionResult<Membership>> {
  const access = await getCurrentUserAccess();

  // Only super admin and ADUN can update membership status
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin can update membership status" };
  }

  const supabase = await getSupabaseServerClient();

  // Get membership to check zone access
  const { data: membership } = await supabase
    .from("memberships")
    .select("zone_id")
    .eq("id", membershipId)
    .single();

  if (!membership) {
    return { success: false, error: "Membership not found" };
  }

  const canAccess = await canAccessZone((membership as any).zone_id);
  if (!canAccess) {
    return { success: false, error: "Access denied" };
  }

  const { data, error } = await supabase
    .from("memberships")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId)
    .select(`
      *,
      zone:zones(id, name),
      cawangan:cawangan(id, name)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/memberships");
  revalidatePath(`/admin/memberships/view/${membershipId}`);
  return { success: true, data: data as Membership };
}

// ==================== SPR Linking Functions ====================

export type LinkedSprVoter = {
  id: number;
  spr_voter_id: number;
  membership_application_id: number;
  linked_by: number | null;
  linked_at: string;
  is_auto_linked: boolean;
  notes: string | null;
  spr_voter: {
    id: number;
    version_id: number;
    no_kp: string | null;
    no_kp_lama: string | null;
    nama: string;
    no_hp: string | null;
    jantina: string | null;
    tarikh_lahir: string | null;
    bangsa: string | null;
    agama: string | null;
    alamat: string | null;
    poskod: string | null;
    daerah: string | null;
    kod_lokaliti: string | null;
    nama_parlimen: string | null;
    nama_dun: string | null;
    nama_lokaliti: string | null;
    nama_tm: string | null;
    saluran: number | null;
    voting_support_status: "white" | "black" | "red" | null;
    version: {
      id: number;
      name: string;
      description: string | null;
      election_date: string | null;
    };
  };
};

/**
 * Get all SPR voters linked to a membership application, grouped by version
 */
export async function getLinkedSprVoters(
  applicationId: number
): Promise<ActionResult<LinkedSprVoter[]>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("membership_application_spr_voters")
    .select(`
      *,
      spr_voter:spr_voters(
        *,
        version:spr_voter_versions(*)
      )
    `)
    .eq("membership_application_id", applicationId)
    .order("linked_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as LinkedSprVoter[] };
}

/**
 * Auto-link SPR voters to a membership application by IC number matching
 * Searches across all versions and links matching records
 */
export async function autoLinkSprVoters(
  applicationId: number
): Promise<ActionResult<{ linked: number; versions: string[] }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await getSupabaseServerClient();

  // Get the membership application
  const { data: application } = await supabase
    .from("membership_applications")
    .select("ic_number")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  const icNumber = (application as any).ic_number;
  if (!icNumber) {
    return { success: false, error: "Application IC number not found" };
  }

  // Normalize IC number (remove spaces and dashes, uppercase)
  const normalizedIc = icNumber.replace(/[\s-]/g, "").toUpperCase();

  // Find all SPR voters matching this IC number across all versions
  // Try both current IC and old IC
  const { data: matchingVotersByCurrentIc, error: error1 } = await supabase
    .from("spr_voters")
    .select(`
      id,
      version_id,
      version:spr_voter_versions(name)
    `)
    .eq("no_kp", normalizedIc);

  const { data: matchingVotersByOldIc, error: error2 } = await supabase
    .from("spr_voters")
    .select(`
      id,
      version_id,
      version:spr_voter_versions(name)
    `)
    .eq("no_kp_lama", normalizedIc);

  if (error1 || error2) {
    return { success: false, error: error1?.message || error2?.message || "Failed to search SPR voters" };
  }

  // Combine and deduplicate results
  const allMatchingVoters = [
    ...(matchingVotersByCurrentIc || []),
    ...(matchingVotersByOldIc || []),
  ];
  const uniqueVoters = Array.from(
    new Map(allMatchingVoters.map((v: any) => [v.id, v])).values()
  );
  const matchingVoters = uniqueVoters;

  if (!matchingVoters || matchingVoters.length === 0) {
    return { success: true, data: { linked: 0, versions: [] } };
  }

  // Get current user staff ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: staffData } = await supabase
    .from("staff")
    .select("id")
    .or(`email.eq.${user.email},ic_number.eq.${user.user_metadata?.ic_number || ""}`)
    .single();

  const staffId = staffData?.id || null;

  // Check which voters are already linked
  const { data: existingLinks } = await supabase
    .from("membership_application_spr_voters")
    .select("spr_voter_id")
    .eq("membership_application_id", applicationId);

  const existingVoterIds = new Set(
    (existingLinks || []).map((link: any) => link.spr_voter_id)
  );

  // Link new voters
  const votersToLink = matchingVoters.filter(
    (voter: any) => !existingVoterIds.has(voter.id)
  );

  if (votersToLink.length === 0) {
    const versions = Array.from(
      new Set(
        matchingVoters.map((v: any) => v.version?.name || "Unknown")
      )
    );
    return { success: true, data: { linked: 0, versions } };
  }

  const linksToInsert = votersToLink.map((voter: any) => ({
    membership_application_id: applicationId,
    spr_voter_id: voter.id,
    linked_by: staffId,
    is_auto_linked: true,
  }));

  const { error: insertError } = await supabase
    .from("membership_application_spr_voters")
    .insert(linksToInsert);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const versions = Array.from(
    new Set(
      matchingVoters.map((v: any) => v.version?.name || "Unknown")
    )
  );

  revalidatePath(`/admin/memberships`);
  return {
    success: true,
    data: { linked: votersToLink.length, versions },
  };
}

/**
 * Manually link an SPR voter to a membership application
 */
export async function linkSprVoter(
  applicationId: number,
  sprVoterId: number,
  notes?: string
): Promise<ActionResult<void>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if link already exists
  const { data: existing } = await supabase
    .from("membership_application_spr_voters")
    .select("id")
    .eq("membership_application_id", applicationId)
    .eq("spr_voter_id", sprVoterId)
    .single();

  if (existing) {
    return { success: false, error: "SPR voter is already linked to this application" };
  }

  // Get current user staff ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: staffData } = await supabase
    .from("staff")
    .select("id")
    .or(`email.eq.${user.email},ic_number.eq.${user.user_metadata?.ic_number || ""}`)
    .single();

  const { error } = await supabase
    .from("membership_application_spr_voters")
    .insert({
      membership_application_id: applicationId,
      spr_voter_id: sprVoterId,
      linked_by: staffData?.id || null,
      is_auto_linked: false,
      notes: notes?.trim() || null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/memberships`);
  return { success: true };
}

/**
 * Unlink an SPR voter from a membership application
 */
export async function unlinkSprVoter(
  applicationId: number,
  sprVoterId: number
): Promise<ActionResult<void>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("membership_application_spr_voters")
    .delete()
    .eq("membership_application_id", applicationId)
    .eq("spr_voter_id", sprVoterId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/memberships`);
  return { success: true };
}

/**
 * Search SPR voters for manual linking
 */
export async function searchSprVotersForLinking(options?: {
  search?: string;
  versionId?: number;
  limit?: number;
}): Promise<ActionResult<Array<{
  id: number;
  version_id: number;
  no_kp: string | null;
  no_kp_lama: string | null;
  nama: string;
  no_hp: string | null;
  jantina: string | null;
  tarikh_lahir: string | null;
  bangsa: string | null;
  agama: string | null;
  alamat: string | null;
  poskod: string | null;
  daerah: string | null;
  kod_lokaliti: string | null;
  nama_parlimen: string | null;
  nama_dun: string | null;
  nama_lokaliti: string | null;
  nama_tm: string | null;
  saluran: number | null;
  voting_support_status: "white" | "black" | "red" | null;
  version: {
    id: number;
    name: string;
  };
}>>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();
  const limit = options?.limit || 20;

  let query = supabase
    .from("spr_voters")
    .select(`
      *,
      version:spr_voter_versions(id, name)
    `)
    .limit(limit);

  if (options?.versionId) {
    query = query.eq("version_id", options.versionId);
  }

  if (options?.search) {
    const searchTerm = options.search.trim();
    // Use or() with proper PostgREST syntax: column.operator.value,column.operator.value
    // For ilike with wildcards, we need to include % in the value
    query = query.or(
      `nama.ilike.%${searchTerm}%,no_kp.ilike.%${searchTerm}%,no_kp_lama.ilike.%${searchTerm}%,alamat.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query.order("nama", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as any };
}
