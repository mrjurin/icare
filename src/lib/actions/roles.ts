"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccess } from "@/lib/utils/access-control";

export type Role = {
  id: number;
  name: string;
  description: string | null;
  responsibilities: string | null;
  created_at: string;
  updated_at: string;
};

export type RoleAssignment = {
  id: number;
  staff_id: number;
  role_id: number;
  zone_id: number;
  village_id: number | null;
  appointed_by: number | null;
  status: string;
  appointed_at: string;
  from_date?: string | null;
  to_date?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  staff_name?: string;
  role_name?: string;
  zone_name?: string;
  village_name?: string;
  appointed_by_name?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
  responsibilities?: string;
};

export type UpdateRoleInput = {
  id: number;
  name?: string;
  description?: string;
  responsibilities?: string;
};

export type CreateRoleAssignmentInput = {
  staffId: number;
  roleId: number;
  zoneId: number;
  villageId?: number | null; // Required for Village Chief, optional for Branch Chief
  fromDate?: string | null;
  toDate?: string | null;
  notes?: string;
};

export type UpdateRoleAssignmentInput = {
  id: number;
  status?: string;
  notes?: string;
};

/**
 * Get all roles
 * Only super_admin and ADUN can view roles
 */
export async function getRoles(): Promise<ActionResult<Role[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view roles" };
  }

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Role[] };
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: number): Promise<ActionResult<Role>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid role ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view roles" };
  }

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Role not found" };
  }

  return { success: true, data: data as Role };
}

/**
 * Create a new role
 * Only super_admin and ADUN can create roles
 */
export async function createRole(input: CreateRoleInput): Promise<ActionResult<Role>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Role name is required" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create roles" };
  }

  // Check if role with same name already exists
  const { data: existing } = await supabase
    .from("roles")
    .select("id")
    .eq("name", input.name.trim())
    .single();

  if (existing) {
    return { success: false, error: "A role with this name already exists" };
  }

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      responsibilities: input.responsibilities?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  return { success: true, data: data as Role };
}

/**
 * Update an existing role
 * Only super_admin and ADUN can update roles
 */
export async function updateRole(input: UpdateRoleInput): Promise<ActionResult<Role>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid role ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update roles" };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Role name cannot be empty" };
    }
    // Check for duplicate name (excluding current role)
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("name", input.name.trim())
      .neq("id", input.id)
      .single();

    if (existing) {
      return { success: false, error: "A role with this name already exists" };
    }
    updates.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.responsibilities !== undefined) {
    updates.responsibilities = input.responsibilities?.trim() || null;
  }

  const { data, error } = await supabase
    .from("roles")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${input.id}`);
  return { success: true, data: data as Role };
}

/**
 * Delete a role
 * Only super_admin and ADUN can delete roles
 * Cannot delete if there are active role assignments
 */
export async function deleteRole(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid role ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete roles" };
  }

  // Check if there are any role assignments using this role
  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("id")
    .eq("role_id", id)
    .limit(1);

  if (assignments && assignments.length > 0) {
    return {
      success: false,
      error: "Cannot delete role: There are active role assignments using this role. Please remove assignments first.",
    };
  }

  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  return { success: true };
}

/**
 * Get all role assignments
 * ADUN can see all assignments in their DUN
 * Super admin can see all assignments
 * Others can see assignments in their accessible zones
 */
export async function getRoleAssignments(options?: {
  zoneId?: number;
  roleId?: number;
  staffId?: number;
  status?: string;
}): Promise<ActionResult<RoleAssignment[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Build query with joins to get related data
  let query = supabase
    .from("role_assignments")
    .select(`
      *,
      staff:staff_id(name),
      role:role_id(name),
      zone:zone_id(name),
      village:village_id(name),
      appointed_by_staff:appointed_by(name)
    `);

  // Apply filters
  if (options?.zoneId) {
    query = query.eq("zone_id", options.zoneId);
  }
  if (options?.roleId) {
    query = query.eq("role_id", options.roleId);
  }
  if (options?.staffId) {
    query = query.eq("staff_id", options.staffId);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query.order("appointed_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Transform the data to flatten the joined fields
  const assignments: RoleAssignment[] = (data || []).map((item: any) => ({
    id: item.id,
    staff_id: item.staff_id,
    role_id: item.role_id,
    zone_id: item.zone_id,
    village_id: item.village_id,
    appointed_by: item.appointed_by,
    status: item.status,
    appointed_at: item.appointed_at,
    from_date: item.from_date || null,
    to_date: item.to_date || null,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
    staff_name: item.staff?.name,
    role_name: item.role?.name,
    zone_name: item.zone?.name,
    village_name: item.village?.name,
    appointed_by_name: item.appointed_by_staff?.name,
  }));

  return { success: true, data: assignments };
}

/**
 * Get role assignments for a specific zone
 */
export async function getRoleAssignmentsByZone(zoneId: number): Promise<ActionResult<RoleAssignment[]>> {
  return getRoleAssignments({ zoneId });
}

/**
 * Create a new role assignment
 * Only ADUN can create role assignments (they appoint people to roles)
 */
export async function createRoleAssignment(
  input: CreateRoleAssignmentInput
): Promise<ActionResult<RoleAssignment>> {
  if (!input.staffId || Number.isNaN(input.staffId)) {
    return { success: false, error: "Staff ID is required" };
  }
  if (!input.roleId || Number.isNaN(input.roleId)) {
    return { success: false, error: "Role ID is required" };
  }
  if (!input.zoneId || Number.isNaN(input.zoneId)) {
    return { success: false, error: "Zone ID is required" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only ADUN can create role assignments
  if (!access.isAdun && !access.isSuperAdmin) {
    return { success: false, error: "Access denied: Only ADUN can appoint people to roles" };
  }

  // Check if staff member exists and is active
  const { data: staff } = await supabase
    .from("staff")
    .select("id, status")
    .eq("id", input.staffId)
    .single();

  if (!staff) {
    return { success: false, error: "Staff member not found" };
  }

  if (staff.status !== "active") {
    return { success: false, error: "Cannot assign role to inactive staff member" };
  }

  // Check if role exists
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("id", input.roleId)
    .single();

  if (!role) {
    return { success: false, error: "Role not found" };
  }

  // Check if zone exists
  const { data: zone } = await supabase
    .from("zones")
    .select("id")
    .eq("id", input.zoneId)
    .single();

  if (!zone) {
    return { success: false, error: "Zone not found" };
  }

  // Get role name to check specific rules
  const { data: roleData } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", input.roleId)
    .single();

  if (!roleData) {
    return { success: false, error: "Role not found" };
  }

  const roleName = roleData.name;
  const isVillageChief = roleName === "Village Chief";
  const isBranchChief = roleName === "Branch Chief";

  // Validation: Village Chief requires village_id
  if (isVillageChief && !input.villageId) {
    return { success: false, error: "Village Chief appointment requires a village to be selected" };
  }

  // Validation: Check if village exists (if provided)
  if (input.villageId) {
    const { data: village } = await supabase
      .from("villages")
      .select("id, zone_id")
      .eq("id", input.villageId)
      .single();

    if (!village) {
      return { success: false, error: "Village not found" };
    }

    // Ensure village belongs to the selected zone
    if (village.zone_id !== input.zoneId) {
      return { success: false, error: "Village does not belong to the selected zone" };
    }

    // Validation: Each village can only have one active Village Chief
    if (isVillageChief) {
      const { data: existingVillageChief } = await supabase
        .from("role_assignments")
        .select("id, staff_id")
        .eq("role_id", input.roleId)
        .eq("village_id", input.villageId)
        .eq("status", "active")
        .single();

      if (existingVillageChief) {
        return {
          success: false,
          error: "This village already has an active Village Chief. Please deactivate the existing appointment first.",
        };
      }
    }

    // Validation: Village Chief and Branch Chief cannot be the same person in the same village
    if (isVillageChief || isBranchChief) {
      // Get the other role ID
      const { data: otherRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", isVillageChief ? "Branch Chief" : "Village Chief")
        .single();

      if (otherRole) {
        const { data: conflictingAssignment } = await supabase
          .from("role_assignments")
          .select("id, role_id")
          .eq("staff_id", input.staffId)
          .eq("village_id", input.villageId)
          .eq("status", "active")
          .in("role_id", [input.roleId, otherRole.id])
          .maybeSingle();

        if (conflictingAssignment) {
          const conflictingRoleName = conflictingAssignment.role_id === input.roleId
            ? roleName
            : (isVillageChief ? "Branch Chief" : "Village Chief");
          return {
            success: false,
            error: `This person is already appointed as ${conflictingRoleName} in this village. Village Chief and Branch Chief cannot be the same person.`,
          };
        }
      }
    }
  }

  // Check if there's already an active assignment for this staff in this zone with this role and village
  let existingQuery = supabase
    .from("role_assignments")
    .select("id")
    .eq("staff_id", input.staffId)
    .eq("role_id", input.roleId)
    .eq("zone_id", input.zoneId)
    .eq("status", "active");

  if (input.villageId) {
    existingQuery = existingQuery.eq("village_id", input.villageId);
  } else {
    existingQuery = existingQuery.is("village_id", null);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    return {
      success: false,
      error: "This staff member already has an active assignment for this role in this location",
    };
  }

  // Get the ADUN's staff ID (the one making the appointment)
  const appointedBy = access.staffId;

  const { data, error } = await supabase
    .from("role_assignments")
    .insert({
      staff_id: input.staffId,
      role_id: input.roleId,
      zone_id: input.zoneId,
      village_id: input.villageId || null,
      appointed_by: appointedBy,
      status: "active",
      from_date: input.fromDate || null,
      to_date: input.toDate || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/zones");
  revalidatePath(`/admin/zones/${input.zoneId}`);
  return { success: true, data: data as RoleAssignment };
}

/**
 * Update a role assignment
 * Only ADUN can update role assignments
 */
export async function updateRoleAssignment(
  input: UpdateRoleAssignmentInput
): Promise<ActionResult<RoleAssignment>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid role assignment ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only ADUN can update role assignments
  if (!access.isAdun && !access.isSuperAdmin) {
    return { success: false, error: "Access denied: Only ADUN can update role assignments" };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || null;
  }

  const { data, error } = await supabase
    .from("role_assignments")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/zones");
  return { success: true, data: data as RoleAssignment };
}

/**
 * Delete a role assignment
 * Only ADUN can delete role assignments
 */
export async function deleteRoleAssignment(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid role assignment ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only ADUN can delete role assignments
  if (!access.isAdun && !access.isSuperAdmin) {
    return { success: false, error: "Access denied: Only ADUN can remove role assignments" };
  }

  const { error } = await supabase.from("role_assignments").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/zones");
  return { success: true };
}

/**
 * Get staff members who can be assigned to roles (active staff only)
 */
export async function getAssignableStaff(): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, email, role, position")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}
