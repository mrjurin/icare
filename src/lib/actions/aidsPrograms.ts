"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccess, getAccessibleZoneIds } from "@/lib/utils/access-control";

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

export type ZoneProgressStats = {
  zone_id: number | null;
  village_id: number | null;
  zone_name?: string;
  village_name?: string;
  total_households: number;
  distributed_households: number;
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
  status?: string;
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
  staffIds?: number[]; // Staff members to assign to this program
};

export type AssignProgramToKetuaCawanganInput = {
  programId: number;
  zoneId: number;
  staffId: number;
  notes?: string;
};

export type GetAidsProgramsResult = {
  programs: AidsProgram[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Get all AIDS programs
 * Admin and ADUN see all programs
 * Zone leaders see programs assigned to their zones
 */
export async function getAidsPrograms(options?: {
  status?: string;
  zoneId?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<GetAidsProgramsResult>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;

  // Build base query - fetch all matching records first (we'll paginate after year filter)
  let query = supabase
    .from("aids_programs")
    .select(`
      *,
      creator:created_by(name)
    `);

  // Apply search filter
  if (options?.search && options.search.trim()) {
    const searchTerm = `%${options.search.trim()}%`;
    query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  // Apply status filter
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  // Note: Year filter will be applied after fetching data
  // because we need to check both start_date and created_at

  // Get zone filter program IDs if zone filter is applied
  let zoneFilterProgramIds: number[] | null = null;
  if (options?.zoneId) {
    // Get program IDs that are assigned to this zone
    const { data: programZones } = await supabase
      .from("aids_program_zones")
      .select("program_id")
      .eq("zone_id", options.zoneId);
    
    if (programZones && programZones.length > 0) {
      zoneFilterProgramIds = programZones.map((pz: any) => pz.program_id);
    } else {
      // No programs in this zone, return empty result
      return {
        success: true,
        data: {
          programs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }

  // Apply access control filters
  let accessFilterProgramIds: number[] | null = null;
  if (access.isZoneLeader && access.zoneId) {
    // Get program assignments for this zone
    const { data: assignments } = await supabase
      .from("aids_program_assignments")
      .select("program_id")
      .eq("zone_id", access.zoneId);
    
    if (assignments && assignments.length > 0) {
      accessFilterProgramIds = assignments.map((a: any) => a.program_id);
    } else {
      // No assigned programs, return empty
      return {
        success: true,
        data: {
          programs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  } else if (access.staffId && !access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    // Staff members see programs they are assigned to
    const { data: assignments } = await supabase
      .from("aids_program_assignments")
      .select("program_id, zone_id")
      .eq("assigned_to", access.staffId)
      .in("assignment_type", ["assigned_staff", "ketua_cawangan"]);
    
    if (assignments && assignments.length > 0) {
      accessFilterProgramIds = assignments.map((a: any) => a.program_id);
    } else {
      // No assigned programs, return empty
      return {
        success: true,
        data: {
          programs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }

  // Apply program ID filters (zone filter and/or access control filter)
  let finalProgramIds: number[] | null = null;
  if (zoneFilterProgramIds && accessFilterProgramIds) {
    // Intersect both filters
    finalProgramIds = zoneFilterProgramIds.filter((id) => accessFilterProgramIds!.includes(id));
  } else if (zoneFilterProgramIds) {
    finalProgramIds = zoneFilterProgramIds;
  } else if (accessFilterProgramIds) {
    finalProgramIds = accessFilterProgramIds;
  }

  if (finalProgramIds !== null) {
    if (finalProgramIds.length === 0) {
      return {
        success: true,
        data: {
          programs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    query = query.in("id", finalProgramIds);
  }

  // Apply ordering
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  let programs = (data || []) as any[];

  // Apply year filter in memory (check start_date or created_at)
  if (options?.year) {
    programs = programs.filter((program: any) => {
      if (program.start_date) {
        const startYear = new Date(program.start_date).getFullYear();
        return startYear === options.year;
      } else {
        const createdYear = new Date(program.created_at).getFullYear();
        return createdYear === options.year;
      }
    });
  }

  // Calculate pagination
  const total = programs.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  // Apply pagination
  programs = programs.slice(offset, offset + limit);

  // Transform and add statistics
  const programsWithStats = await Promise.all(
    programs.map(async (program: any) => {
      // For staff members, get their assigned zone IDs for this program
      let zoneIds: number[] | undefined = undefined;
      if (access.staffId && !access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
        const { data: programAssignments } = await supabase
          .from("aids_program_assignments")
          .select("zone_id")
          .eq("program_id", program.id)
          .eq("assigned_to", access.staffId)
          .in("assignment_type", ["assigned_staff", "ketua_cawangan"]);
        
        if (programAssignments && programAssignments.length > 0) {
          zoneIds = [...new Set(programAssignments.map((a: any) => a.zone_id).filter((id: any): id is number => id !== null))];
        }
      } else if (access.isZoneLeader && access.zoneId) {
        // Zone leaders see stats for their zone only
        zoneIds = [access.zoneId];
      }
      
      const stats = await getProgramStatistics(program.id, zoneIds);
      return {
        ...program,
        creator_name: program.creator?.name,
        total_households: stats.total_households,
        distributed_households: stats.distributed_households,
      };
    })
  );

  return {
    success: true,
    data: {
      programs: programsWithStats as AidsProgram[],
      total,
      page,
      limit,
      totalPages,
    },
  };
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
      status: input.status || "draft",
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

  // Handle staff assignments if provided
  if (input.staffIds !== undefined) {
    if (!access.staffId) {
      return { success: false, error: "Staff ID not found" };
    }

    // Get program zones to determine which zones to assign staff to
    const { data: programZones } = await supabase
      .from("aids_program_zones")
      .select("zone_id")
      .eq("program_id", input.id);

    let zoneIds = [
      ...new Set(
        (programZones || [])
          .map((pz) => pz.zone_id)
          .filter((id): id is number => id !== null)
      ),
    ];

    // If no zones in aids_program_zones, check aids_program_assignments for zones
    if (zoneIds.length === 0) {
      const { data: assignments } = await supabase
        .from("aids_program_assignments")
        .select("zone_id")
        .eq("program_id", input.id);

      if (assignments && assignments.length > 0) {
        zoneIds = [
          ...new Set(
            assignments
              .map((a) => a.zone_id)
              .filter((id): id is number => id !== null)
          ),
        ];
      }
    }

    // Remove existing "assigned_staff" assignments for this program
    const { error: deleteError } = await supabase
      .from("aids_program_assignments")
      .delete()
      .eq("program_id", input.id)
      .eq("assignment_type", "assigned_staff");

    if (deleteError) {
      console.error("Error deleting existing assignments:", deleteError);
    }

    // Create new assignments if staff IDs are provided
    if (input.staffIds && input.staffIds.length > 0) {
      if (zoneIds.length === 0) {
        // Don't return error, just log and skip - program might not have zones yet
        console.warn("Program has no zones assigned, skipping staff assignments");
      } else {
        // Get staff members and their zones
        const { data: staffMembers, error: staffError } = await supabase
          .from("staff")
          .select("id, zone_id")
          .in("id", input.staffIds)
          .eq("status", "active");

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          return { success: false, error: `Failed to fetch staff: ${staffError.message}` };
        }

        if (!staffMembers || staffMembers.length === 0) {
          console.warn("No active staff members found with the provided IDs");
          // Don't return error - just continue, assignments were already cleared
        } else {
          // Create assignments for each staff member
          const assignments = [];
          for (const staff of staffMembers) {
            // Use staff's zone_id if available, otherwise use first program zone
            const zoneId = staff.zone_id || zoneIds[0];
            
            // Check if assignment already exists (for other assignment types like ketua_cawangan)
            // We use maybeSingle() to avoid errors when no assignment exists
            const { data: existing } = await supabase
              .from("aids_program_assignments")
              .select("id")
              .eq("program_id", input.id)
              .eq("zone_id", zoneId)
              .eq("assigned_to", staff.id)
              .maybeSingle();

            // Only create assignment if one doesn't already exist (for other types)
            if (!existing) {
              assignments.push({
                program_id: input.id,
                zone_id: zoneId,
                assigned_to: staff.id,
                assigned_by: access.staffId,
                assignment_type: "assigned_staff",
                status: "active",
              });
            }
          }

          if (assignments.length > 0) {
            const { error: insertError } = await supabase
              .from("aids_program_assignments")
              .insert(assignments);

            if (insertError) {
              console.error("Error inserting assignments:", insertError);
              return { success: false, error: `Failed to create assignments: ${insertError.message}` };
            }
          }
        }
      }
    }
    // If staffIds is empty array, we've already deleted existing assignments above
  }

  revalidatePath("/admin/aids-programs");
  revalidatePath(`/admin/aids-programs/${input.id}`);
  revalidatePath("/staff/aids-programs");
  return { success: true, data: data as AidsProgram };
}

/**
 * Delete an AIDS program
 * Only admin and ADUN can delete programs
 * Only draft programs can be deleted
 */
export async function deleteAidsProgram(programId: number): Promise<ActionResult> {
  if (!programId || Number.isNaN(programId)) {
    return { success: false, error: "Invalid program ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only admin and ADUN can delete programs" };
  }

  // Check if program exists and is in draft status
  const { data: program, error: fetchError } = await supabase
    .from("aids_programs")
    .select("id, status")
    .eq("id", programId)
    .single();

  if (fetchError || !program) {
    return { success: false, error: "Program not found" };
  }

  if (program.status !== "draft") {
    return { success: false, error: "Only draft programs can be deleted" };
  }

  // Delete the program (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from("aids_programs")
    .delete()
    .eq("id", programId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/admin/aids-programs");
  return { success: true };
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
 * Get assigned staff IDs for a program (admin-assigned staff only)
 */
export async function getProgramAssignedStaffIds(
  programId: number
): Promise<ActionResult<number[]>> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("aids_program_assignments")
    .select("assigned_to")
    .eq("program_id", programId)
    .eq("assignment_type", "assigned_staff");

  if (error) {
    return { success: false, error: error.message };
  }

  const staffIds = [...new Set((data || []).map((a: any) => a.assigned_to))];
  return { success: true, data: staffIds };
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
async function getProgramStatistics(
  programId: number,
  filterZoneIds?: number[]
): Promise<{
  total_households: number;
  distributed_households: number;
}> {
  const supabase = await getSupabaseServerClient();

  // Collect all zone IDs to query
  const allZoneIds = new Set<number>();

  // If zone filter is provided (for staff/zone leader), use only those zones
  if (filterZoneIds && filterZoneIds.length > 0) {
    filterZoneIds.forEach((id) => allZoneIds.add(id));
  } else {
    // Otherwise, get all zones for the program
    // Get program zones
    const { data: programZones, error: zonesError } = await supabase
      .from("aids_program_zones")
      .select("zone_id, village_id")
      .eq("program_id", programId);

    if (zonesError) {
      console.error("Error fetching program zones:", zonesError);
      return { total_households: 0, distributed_households: 0 };
    }

    // If program zones exist, use them
    if (programZones && programZones.length > 0) {
      // Extract zone IDs and village IDs
      const zoneIds = programZones
        .map((pz) => pz.zone_id)
        .filter((id): id is number => id !== null);
      const villageIds = programZones
        .map((pz) => pz.village_id)
        .filter((id): id is number => id !== null);

      // Add zone IDs
      zoneIds.forEach((id) => allZoneIds.add(id));

      // If villages are specified, get their zone IDs and add to the set
      if (villageIds.length > 0) {
        const { data: villages, error: villagesError } = await supabase
          .from("villages")
          .select("id, zone_id")
          .in("id", villageIds);

        if (villagesError) {
          console.error("Error fetching villages:", villagesError);
        } else if (villages && villages.length > 0) {
          // Add zone IDs from villages
          villages.forEach((v) => {
            if (v.zone_id) {
              allZoneIds.add(v.zone_id);
            }
          });
        }
      }
    } else {
      // If no program zones exist, check program assignments to get zones
      const { data: assignments, error: assignmentsError } = await supabase
        .from("aids_program_assignments")
        .select("zone_id")
        .eq("program_id", programId);

      if (assignmentsError) {
        console.error("Error fetching program assignments:", assignmentsError);
      } else if (assignments && assignments.length > 0) {
        // Get unique zone IDs from assignments
        assignments.forEach((a) => {
          if (a.zone_id) {
            allZoneIds.add(a.zone_id);
          }
        });
      }
    }
  }

  // Count households in all relevant zones
  let totalHouseholds = 0;
  if (allZoneIds.size > 0) {
    const { count, error: householdError } = await supabase
      .from("households")
      .select("id", { count: "exact", head: true })
      .in("zone_id", Array.from(allZoneIds));
    
    if (householdError) {
      console.error("Error counting households:", householdError);
    } else {
      totalHouseholds = count || 0;
    }
  }

  // Get distributed count - filter by zone if zone filter is provided
  let distributedHouseholds = 0;
  if (allZoneIds.size > 0) {
    // Get household IDs in the filtered zones
    const { data: zoneHouseholds } = await supabase
      .from("households")
      .select("id")
      .in("zone_id", Array.from(allZoneIds));

    const householdIds = (zoneHouseholds || []).map((h) => h.id);

    if (householdIds.length > 0) {
      const { count, error: distributionError } = await supabase
        .from("aids_distribution_records")
        .select("*", { count: "exact", head: true })
        .eq("program_id", programId)
        .in("household_id", householdIds);

      if (distributionError) {
        console.error("Error counting distributed households:", distributionError);
      } else {
        distributedHouseholds = count || 0;
      }
    }
  }

  return {
    total_households: totalHouseholds,
    distributed_households: distributedHouseholds,
  };
}

/**
 * Get program statistics per zone/village
 */
export async function getProgramZoneProgress(
  programId: number
): Promise<ActionResult<ZoneProgressStats[]>> {
  const supabase = await getSupabaseServerClient();

  // Get program zones
  const { data: programZones, error: zonesError } = await supabase
    .from("aids_program_zones")
    .select(`
      id,
      zone_id,
      village_id,
      zone:zone_id(name),
      village:village_id(name)
    `)
    .eq("program_id", programId);

  if (zonesError) {
    console.error("Error fetching program zones:", zonesError);
    return { success: false, error: zonesError.message };
  }

  const stats: ZoneProgressStats[] = [];

  // If program zones exist, calculate stats per zone/village
  if (programZones && programZones.length > 0) {
    for (const pz of programZones) {
      let zoneIds: number[] = [];
      let zoneName: string | undefined;
      let villageName: string | undefined;

      if (pz.village_id) {
        // If village is specified, get its zone
        const { data: village } = await supabase
          .from("villages")
          .select("id, zone_id, name")
          .eq("id", pz.village_id)
          .single();

        if (village?.zone_id) {
          zoneIds = [village.zone_id];
        }
        villageName = (pz as any).village?.name || village?.name;
      } else if (pz.zone_id) {
        zoneIds = [pz.zone_id];
      }

      zoneName = (pz as any).zone?.name;

      if (zoneIds.length > 0) {
        // Count households in this zone
        const { count: totalHouseholds } = await supabase
          .from("households")
          .select("id", { count: "exact", head: true })
          .in("zone_id", zoneIds);

        // Count distributed households for this program in this zone
        // Get household IDs in this zone first
        const { data: zoneHouseholds } = await supabase
          .from("households")
          .select("id")
          .in("zone_id", zoneIds);

        const householdIds = (zoneHouseholds || []).map((h) => h.id);

        let distributedHouseholds = 0;
        if (householdIds.length > 0) {
          const { count } = await supabase
            .from("aids_distribution_records")
            .select("*", { count: "exact", head: true })
            .eq("program_id", programId)
            .in("household_id", householdIds);

          distributedHouseholds = count || 0;
        }

        stats.push({
          zone_id: pz.zone_id,
          village_id: pz.village_id,
          zone_name: zoneName,
          village_name: villageName,
          total_households: totalHouseholds || 0,
          distributed_households: distributedHouseholds,
        });
      }
    }
  } else {
    // If no program zones exist, check program assignments to get zones
    const { data: assignments, error: assignmentsError } = await supabase
      .from("aids_program_assignments")
      .select(`
        zone_id,
        zone:zone_id(name)
      `)
      .eq("program_id", programId);

    if (assignmentsError) {
      console.error("Error fetching program assignments:", assignmentsError);
    } else if (assignments && assignments.length > 0) {
      // Get unique zones
      const uniqueZones = new Map<number, { name?: string }>();
      assignments.forEach((a) => {
        if (a.zone_id) {
          uniqueZones.set(a.zone_id, {
            name: (a as any).zone?.name,
          });
        }
      });

      // Calculate stats for each zone
      for (const [zoneId, zoneData] of uniqueZones.entries()) {
        // Count households in this zone
        const { count: totalHouseholds } = await supabase
          .from("households")
          .select("id", { count: "exact", head: true })
          .eq("zone_id", zoneId);

        // Get household IDs in this zone
        const { data: zoneHouseholds } = await supabase
          .from("households")
          .select("id")
          .eq("zone_id", zoneId);

        const householdIds = (zoneHouseholds || []).map((h) => h.id);

        let distributedHouseholds = 0;
        if (householdIds.length > 0) {
          const { count } = await supabase
            .from("aids_distribution_records")
            .select("*", { count: "exact", head: true })
            .eq("program_id", programId)
            .in("household_id", householdIds);

          distributedHouseholds = count || 0;
        }

        stats.push({
          zone_id: zoneId,
          village_id: null,
          zone_name: zoneData.name,
          village_name: undefined,
          total_households: totalHouseholds || 0,
          distributed_households: distributedHouseholds,
        });
      }
    }
  }

  return { success: true, data: stats };
}
