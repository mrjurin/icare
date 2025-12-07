"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccess, getAccessibleZoneIds } from "@/lib/utils/accessControl";

export type AidsProgram = {
  id: number;
  name: string;
  description: string | null;
  aid_type: string;
  status: string;
  created_by: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator_name?: string;
  total_households?: number;
  distributed_households?: number;
};

export type AidsProgramZone = {
  id: number;
  program_id: number;
  zone_id: number | null;
  village_id: number | null;
  created_at: string;
  // Joined data
  zone_name?: string;
  village_name?: string;
};

export type AidsProgramAssignment = {
  id: number;
  program_id: number;
  zone_id: number;
  assigned_to: number;
  assigned_by: number | null;
  assignment_type: string;
  status: string;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  program_name?: string;
  zone_name?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
};

export type AidsDistributionRecord = {
  id: number;
  program_id: number;
  household_id: number;
  marked_by: number;
  marked_at: string;
  notes: string | null;
  created_at: string;
  // Joined data
  household_name?: string;
  household_address?: string;
  marked_by_name?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateAidsProgramInput = {
  name: string;
  description?: string;
  aidType: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  zoneIds?: number[];
  villageIds?: number[];
};

export type UpdateAidsProgramInput = {
  id: number;
  name?: string;
  description?: string;
  aidType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type AssignProgramToKetuaCawanganInput = {
  programId: number;
  zoneId: number;
  staffId: number;
  notes?: string;
};

/**
 * Get all AIDS programs
 * Admin and ADUN see all programs
 * Zone leaders see programs assigned to their zones
 */
export async function getAidsPrograms(options?: {
  status?: string;
  zoneId?: number;
}): Promise<ActionResult<AidsProgram[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  let query = supabase
    .from("aids_programs")
    .select(`
      *,
      creator:created_by(name)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Filter by zone access if user is zone leader
  let programs = (data || []) as any[];
  
  if (access.isZoneLeader && access.zoneId) {
    // Get program assignments for this zone
    const { data: assignments } = await supabase
      .from("aids_program_assignments")
      .select("program_id")
      .eq("zone_id", access.zoneId);
    
    const assignedProgramIds = new Set((assignments || []).map((a: any) => a.program_id));
    programs = programs.filter((p: any) => assignedProgramIds.has(p.id));
  }

  // Transform and add statistics
  const programsWithStats = await Promise.all(
    programs.map(async (program: any) => {
      const stats = await getProgramStatistics(program.id);
      return {
        ...program,
        creator_name: program.creator?.name,
        total_households: stats.total_households,
        distributed_households: stats.distributed_households,
      };
    })
  );

  return { success: true, data: programsWithStats as AidsProgram[] };
}

/**
 * Get a single AIDS program by ID
 */
export async function getAidsProgramById(id: number): Promise<ActionResult<AidsProgram>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid program ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("aids_programs")
    .select(`
      *,
      creator:created_by(name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Program not found" };
  }

  const stats = await getProgramStatistics(id);
  const program = {
    ...data,
    creator_name: (data as any).creator?.name,
    total_households: stats.total_households,
    distributed_households: stats.distributed_households,
  };

  return { success: true, data: program as AidsProgram };
}

/**
 * Create a new AIDS program
 * Only admin and ADUN can create programs
 */
export async function createAidsProgram(
  input: CreateAidsProgramInput
): Promise<ActionResult<AidsProgram>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Program name is required" };
  }
  if (!input.aidType?.trim()) {
    return { success: false, error: "Aid type is required" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin and ADUN can create programs" };
  }

  if (!access.staffId) {
    return { success: false, error: "Staff ID not found" };
  }

  // Create the program
  const { data: program, error: programError } = await supabase
    .from("aids_programs")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      aid_type: input.aidType.trim(),
      status: "draft",
      created_by: access.staffId,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (programError || !program) {
    return { success: false, error: programError?.message || "Failed to create program" };
  }

  // Assign zones/villages
  if (input.zoneIds && input.zoneIds.length > 0) {
    const zoneAssignments = input.zoneIds.map((zoneId) => ({
      program_id: program.id,
      zone_id: zoneId,
      village_id: null,
    }));

    await supabase.from("aids_program_zones").insert(zoneAssignments);

    // Automatically assign to zone leaders
    for (const zoneId of input.zoneIds) {
      const { data: zoneLeader } = await supabase
        .from("staff")
        .select("id")
        .eq("zone_id", zoneId)
        .eq("role", "zone_leader")
        .eq("status", "active")
        .single();

      if (zoneLeader) {
        await supabase.from("aids_program_assignments").insert({
          program_id: program.id,
          zone_id: zoneId,
          assigned_to: zoneLeader.id,
          assigned_by: access.staffId,
          assignment_type: "zone_leader",
          status: "pending",
        });
      }
    }
  }

  if (input.villageIds && input.villageIds.length > 0) {
    // Get zone IDs for villages
    const { data: villages } = await supabase
      .from("villages")
      .select("id, zone_id")
      .in("id", input.villageIds);

    const villageAssignments = (villages || []).map((village) => ({
      program_id: program.id,
      zone_id: village.zone_id,
      village_id: village.id,
    }));

    await supabase.from("aids_program_zones").insert(villageAssignments);

    // Automatically assign to zone leaders for each unique zone
    const uniqueZoneIds = [...new Set((villages || []).map((v) => v.zone_id))];
    for (const zoneId of uniqueZoneIds) {
      const { data: zoneLeader } = await supabase
        .from("staff")
        .select("id")
        .eq("zone_id", zoneId)
        .eq("role", "zone_leader")
        .eq("status", "active")
        .single();

      if (zoneLeader) {
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from("aids_program_assignments")
          .select("id")
          .eq("program_id", program.id)
          .eq("zone_id", zoneId)
          .eq("assigned_to", zoneLeader.id)
          .single();

        if (!existing) {
          await supabase.from("aids_program_assignments").insert({
            program_id: program.id,
            zone_id: zoneId,
            assigned_to: zoneLeader.id,
            assigned_by: access.staffId,
            assignment_type: "zone_leader",
            status: "pending",
          });
        }
      }
    }
  }

  revalidatePath("/admin/aids-programs");
  return { success: true, data: program as AidsProgram };
}

/**
 * Update an AIDS program
 * Only admin and ADUN can update programs
 */
export async function updateAidsProgram(
  input: UpdateAidsProgramInput
): Promise<ActionResult<AidsProgram>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid program ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin and ADUN can update programs" };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Program name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.aidType !== undefined) {
    updates.aid_type = input.aidType.trim();
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.startDate !== undefined) {
    updates.start_date = input.startDate || null;
  }

  if (input.endDate !== undefined) {
    updates.end_date = input.endDate || null;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || null;
  }

  const { data, error } = await supabase
    .from("aids_programs")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/aids-programs");
  revalidatePath(`/admin/aids-programs/${input.id}`);
  return { success: true, data: data as AidsProgram };
}

/**
 * Get program zones/villages
 */
export async function getProgramZones(
  programId: number
): Promise<ActionResult<AidsProgramZone[]>> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("aids_program_zones")
    .select(`
      *,
      zone:zone_id(name),
      village:village_id(name)
    `)
    .eq("program_id", programId);

  if (error) {
    return { success: false, error: error.message };
  }

  const zones = (data || []).map((item: any) => ({
    ...item,
    zone_name: item.zone?.name,
    village_name: item.village?.name,
  }));

  return { success: true, data: zones as AidsProgramZone[] };
}

/**
 * Get program assignments for a zone
 */
export async function getProgramAssignments(
  programId: number,
  zoneId?: number
): Promise<ActionResult<AidsProgramAssignment[]>> {
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("aids_program_assignments")
    .select(`
      *,
      program:program_id(name),
      zone:zone_id(name),
      assigned_to_staff:assigned_to(name),
      assigned_by_staff:assigned_by(name)
    `)
    .eq("program_id", programId);

  if (zoneId) {
    query = query.eq("zone_id", zoneId);
  }

  const { data, error } = await query.order("assigned_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const assignments = (data || []).map((item: any) => ({
    ...item,
    program_name: item.program?.name,
    zone_name: item.zone?.name,
    assigned_to_name: item.assigned_to_staff?.name,
    assigned_by_name: item.assigned_by_staff?.name,
  }));

  return { success: true, data: assignments as AidsProgramAssignment[] };
}

/**
 * Assign program to ketua cawangan
 * Zone leaders can assign programs to ketua cawangan in their zone
 */
export async function assignProgramToKetuaCawangan(
  input: AssignProgramToKetuaCawanganInput
): Promise<ActionResult<AidsProgramAssignment>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Check if user is zone leader for this zone
  if (access.isZoneLeader && access.zoneId !== input.zoneId) {
    return { success: false, error: "Access denied: You can only assign programs in your zone" };
  }

  if (!access.isZoneLeader && !access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only zone leaders, admin, and ADUN can assign programs",
    };
  }

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from("aids_program_assignments")
    .select("id")
    .eq("program_id", input.programId)
    .eq("zone_id", input.zoneId)
    .eq("assigned_to", input.staffId)
    .eq("assignment_type", "ketua_cawangan")
    .single();

  if (existing) {
    return { success: false, error: "This staff member is already assigned to this program" };
  }

  const { data, error } = await supabase
    .from("aids_program_assignments")
    .insert({
      program_id: input.programId,
      zone_id: input.zoneId,
      assigned_to: input.staffId,
      assigned_by: access.staffId,
      assignment_type: "ketua_cawangan",
      status: "pending",
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/aids-programs");
  revalidatePath(`/admin/aids-programs/${input.programId}`);
  return { success: true, data: data as AidsProgramAssignment };
}

/**
 * Get households for a program in a zone
 * Returns all households in the zone with distribution status
 */
export async function getProgramHouseholds(
  programId: number,
  zoneId: number
): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Get all households in the zone
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, head_name, address, zone_id")
    .eq("zone_id", zoneId)
    .order("head_name", { ascending: true });

  if (householdsError) {
    return { success: false, error: householdsError.message };
  }

  // Get distribution records for this program
  const { data: distributions } = await supabase
    .from("aids_distribution_records")
    .select("household_id, marked_at, marked_by")
    .eq("program_id", programId)
    .in(
      "household_id",
      (households || []).map((h) => h.id)
    );

  const distributedHouseholdIds = new Set(
    (distributions || []).map((d: any) => d.household_id)
  );

  // Combine data
  const householdsWithStatus = (households || []).map((household) => {
    const distribution = (distributions || []).find((d: any) => d.household_id === household.id);
    return {
      ...household,
      received: distributedHouseholdIds.has(household.id),
      marked_at: distribution?.marked_at || null,
      marked_by: distribution?.marked_by || null,
    };
  });

  return { success: true, data: householdsWithStatus };
}

/**
 * Mark household as distributed
 * Ketua cawangan can mark households as having received aids
 */
export async function markHouseholdDistributed(
  programId: number,
  householdId: number,
  notes?: string
): Promise<ActionResult<AidsDistributionRecord>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Authentication required" };
  }

  // Check if already marked
  const { data: existing } = await supabase
    .from("aids_distribution_records")
    .select("id")
    .eq("program_id", programId)
    .eq("household_id", householdId)
    .single();

  if (existing) {
    return { success: false, error: "This household has already been marked as distributed" };
  }

  const { data, error } = await supabase
    .from("aids_distribution_records")
    .insert({
      program_id: programId,
      household_id: householdId,
      marked_by: access.staffId,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/aids-programs");
  revalidatePath(`/admin/aids-programs/${programId}`);
  return { success: true, data: data as AidsDistributionRecord };
}

/**
 * Unmark household as distributed
 */
export async function unmarkHouseholdDistributed(
  programId: number,
  householdId: number
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("aids_distribution_records")
    .delete()
    .eq("program_id", programId)
    .eq("household_id", householdId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/aids-programs");
  revalidatePath(`/admin/aids-programs/${programId}`);
  return { success: true };
}

/**
 * Get program statistics
 */
async function getProgramStatistics(programId: number): Promise<{
  total_households: number;
  distributed_households: number;
}> {
  const supabase = await getSupabaseServerClient();

  // Get program zones
  const { data: programZones } = await supabase
    .from("aids_program_zones")
    .select("zone_id, village_id")
    .eq("program_id", programId);

  if (!programZones || programZones.length === 0) {
    return { total_households: 0, distributed_households: 0 };
  }

  // Get all households in these zones/villages
  let householdQuery = supabase.from("households").select("id", { count: "exact" });

  const zoneIds = programZones
    .map((pz) => pz.zone_id)
    .filter((id): id is number => id !== null);
  const villageIds = programZones
    .map((pz) => pz.village_id)
    .filter((id): id is number => id !== null);

  if (zoneIds.length > 0 && villageIds.length === 0) {
    householdQuery = householdQuery.in("zone_id", zoneIds);
  } else if (villageIds.length > 0) {
    // Get households in specific villages
    const { data: villages } = await supabase
      .from("villages")
      .select("id, zone_id")
      .in("id", villageIds);

    const villageZoneIds = [...new Set((villages || []).map((v) => v.zone_id))];
    if (villageZoneIds.length > 0) {
      householdQuery = householdQuery.in("zone_id", villageZoneIds);
    }
  }

  const { count: totalHouseholds } = await householdQuery;

  // Get distributed count
  const { count: distributedHouseholds } = await supabase
    .from("aids_distribution_records")
    .select("*", { count: "exact", head: true })
    .eq("program_id", programId);

  return {
    total_households: totalHouseholds || 0,
    distributed_households: distributedHouseholds || 0,
  };
}
