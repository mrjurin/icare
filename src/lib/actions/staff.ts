"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/**
 * Get Supabase admin client for password management
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
function getSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Generate email for Supabase Auth when only IC number is provided
 */
function generateAuthEmail(icNumber: string): string {
  // Remove any dashes or spaces from IC number
  const cleanIc = icNumber.replace(/[-\s]/g, "");
  return `${cleanIc}@staff.local`;
}

/**
 * Get the email to use for Supabase Auth
 * Uses actual email if available, otherwise generates one from IC number
 */
function getAuthEmail(email: string | null | undefined, icNumber: string | null | undefined): string {
  if (email?.trim()) {
    return email.trim().toLowerCase();
  }
  if (icNumber?.trim()) {
    return generateAuthEmail(icNumber.trim());
  }
  throw new Error("Either email or IC number must be provided");
}

export type StaffRole = "adun" | "super_admin" | "zone_leader" | "staff_manager" | "staff";
export type StaffStatus = "active" | "inactive";

export type Staff = {
  id: number;
  name: string;
  email: string | null;
  ic_number: string | null;
  phone: string | null;
  role: StaffRole;
  position: string | null;
  zone_id: number | null;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type CreateStaffInput = {
  name: string;
  email?: string; // Optional - can use IC number instead
  icNumber?: string; // IC number for login (Sabah context)
  phone?: string;
  role: StaffRole;
  position?: string;
  zoneId?: number; // Required for zone_leader role
  password?: string; // Initial password for staff
};

export type UpdateStaffInput = {
  id: number;
  name?: string;
  email?: string;
  icNumber?: string;
  phone?: string;
  role?: StaffRole;
  position?: string;
  zoneId?: number;
  status?: StaffStatus;
  password?: string; // Update password
};

const ROLE_LABELS: Record<StaffRole, string> = {
  adun: "ADUN",
  super_admin: "Super Admin",
  zone_leader: "Zone Leader",
  staff_manager: "Staff Manager",
  staff: "Staff",
};

export async function getRoleLabel(role: StaffRole): Promise<string> {
  return ROLE_LABELS[role] || role;
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Get all staff members
 * Only super_admin and ADUN can see all staff
 * Zone leaders can only see themselves
 */
export async function getStaffList(options?: {
  status?: StaffStatus;
  role?: StaffRole;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<Staff>>> {
  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check access control
  const access = await getCurrentUserAccess();
  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const offset = (page - 1) * limit;

  // Zone leaders can only see themselves
  if (access.isZoneLeader && access.staffId) {
    const { data, error, count } = await supabase
      .from("staff")
      .select("*", { count: "exact" })
      .eq("id", access.staffId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count || 0;
    return {
      success: true,
      data: {
        data: (data || []) as Staff[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Build count query
  let countQuery = supabase.from("staff").select("*", { count: "exact", head: true });

  if (options?.status) {
    countQuery = countQuery.eq("status", options.status);
  }
  if (options?.role) {
    countQuery = countQuery.eq("role", options.role);
  }
  if (options?.search) {
    countQuery = countQuery.or(
      `name.ilike.%${options.search}%,email.ilike.%${options.search}%,position.ilike.%${options.search}%`
    );
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    return { success: false, error: countError.message };
  }

  const total = count || 0;

  // Build data query
  let query = supabase
    .from("staff")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.role) {
    query = query.eq("role", options.role);
  }
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,email.ilike.%${options.search}%,position.ilike.%${options.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      data: (data || []) as Staff[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single staff member by ID
 */
export async function getStaffById(id: number): Promise<ActionResult<Staff>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid staff ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Staff };
}

/**
 * Get active staff members for assignment dropdown
 */
export async function getActiveStaff(): Promise<ActionResult<Staff[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Staff[] };
}

/**
 * Create a new staff member
 * Only super_admin and ADUN can create staff
 */
export async function createStaff(
  input: CreateStaffInput
): Promise<ActionResult<Staff>> {
  // Validation
  if (!input.name?.trim()) {
    return { success: false, error: "Name is required" };
  }
  
  // At least one of email or IC number must be provided
  if (!input.email?.trim() && !input.icNumber?.trim()) {
    return { success: false, error: "Either email or IC number is required" };
  }
  
  // Validate email format if provided
  if (input.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      return { success: false, error: "Invalid email format" };
    }
  }
  
  if (!input.role) {
    return { success: false, error: "Role is required" };
  }

  // Zone leaders must have a zone assigned
  if (input.role === "zone_leader" && !input.zoneId) {
    return { success: false, error: "Zone is required for zone leader role" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to create staff
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can create staff" };
  }

  // Check for duplicate email (if provided)
  if (input.email?.trim()) {
    const { data: existingEmail } = await supabase
      .from("staff")
      .select("id")
      .eq("email", input.email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      return { success: false, error: "A staff member with this email already exists" };
    }
  }

  // Check for duplicate IC number (if provided)
  if (input.icNumber?.trim()) {
    const { data: existingIc } = await supabase
      .from("staff")
      .select("id")
      .eq("ic_number", input.icNumber.trim())
      .single();

    if (existingIc) {
      return { success: false, error: "A staff member with this IC number already exists" };
    }
  }

  // Get auth email (use actual email or generate from IC number)
  const authEmail = getAuthEmail(input.email, input.icNumber);

  // Create staff record
  const { data, error } = await supabase
    .from("staff")
    .insert({
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase() || null,
      ic_number: input.icNumber?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.role,
      position: input.position?.trim() || null,
      zone_id: input.zoneId || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Create or update Supabase Auth user if password is provided
  if (input.password?.trim()) {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      
      // Check if auth user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === authEmail.toLowerCase()
      );

      if (existingUser) {
        // Update existing user password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: input.password.trim(),
          email_confirm: true,
        });
      } else {
        // Create new auth user
        await supabaseAdmin.auth.admin.createUser({
          email: authEmail.toLowerCase(),
          password: input.password.trim(),
          email_confirm: true,
          user_metadata: {
            full_name: input.name.trim(),
            staff_id: data.id,
          },
        });
      }
    } catch (authError) {
      // Log error but don't fail staff creation
      console.error("Failed to create/update auth user:", authError);
      // Continue - staff record is created, admin can set password later
    }
  }

  revalidatePath("/admin/staff");
  return { success: true, data: data as Staff };
}

/**
 * Update an existing staff member
 * Only super_admin and ADUN can update staff
 * Zone leaders can only update themselves (limited fields)
 */
export async function updateStaff(
  input: UpdateStaffInput
): Promise<ActionResult<Staff>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid staff ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check access control
  const access = await getCurrentUserAccess();
  
  // Zone leaders can only update themselves
  if (access.isZoneLeader) {
    if (input.id !== access.staffId) {
      return { success: false, error: "Access denied: You can only update your own profile" };
    }
    // Zone leaders can only update limited fields (name, phone, position)
    // They cannot change role, zone, or status
    if (input.role !== undefined || input.zoneId !== undefined || input.status !== undefined) {
      return { success: false, error: "Access denied: You cannot change role, zone, or status" };
    }
  } else if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update staff" };
  }

  // If role is being changed to zone_leader, zone is required
  if (input.role === "zone_leader" && !input.zoneId) {
    // Check current staff to see if they already have a zone
    const { data: currentStaff } = await supabase
      .from("staff")
      .select("zone_id")
      .eq("id", input.id)
      .single();
    
    if (!currentStaff?.zone_id) {
      return { success: false, error: "Zone is required for zone leader role" };
    }
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  // Get current staff data to check existing email/IC
  const { data: currentStaff } = await supabase
    .from("staff")
    .select("email, ic_number")
    .eq("id", input.id)
    .single();

  if (!currentStaff) {
    return { success: false, error: "Staff member not found" };
  }

  // Validate that at least one identifier exists after update
  const finalEmail = input.email !== undefined ? input.email : currentStaff.email;
  const finalIcNumber = input.icNumber !== undefined ? input.icNumber : currentStaff.ic_number;
  
  if (!finalEmail?.trim() && !finalIcNumber?.trim()) {
    return { success: false, error: "Either email or IC number must be provided" };
  }

  if (input.email !== undefined) {
    if (input.email === null || input.email === "") {
      // Allow clearing email if IC number exists
      if (!finalIcNumber?.trim()) {
        return { success: false, error: "Cannot remove email if no IC number is provided" };
      }
      updates.email = null;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        return { success: false, error: "Invalid email format" };
      }
      // Check for duplicate email (excluding current staff)
      const { data: existing } = await supabase
        .from("staff")
        .select("id")
        .eq("email", input.email.toLowerCase().trim())
        .neq("id", input.id)
        .single();

      if (existing) {
        return { success: false, error: "A staff member with this email already exists" };
      }
      updates.email = input.email.toLowerCase().trim();
    }
  }

  if (input.icNumber !== undefined) {
    if (input.icNumber === null || input.icNumber === "") {
      // Allow clearing IC number if email exists
      if (!finalEmail?.trim()) {
        return { success: false, error: "Cannot remove IC number if no email is provided" };
      }
      updates.ic_number = null;
    } else {
      // Check for duplicate IC number (excluding current staff)
      const { data: existing } = await supabase
        .from("staff")
        .select("id")
        .eq("ic_number", input.icNumber.trim())
        .neq("id", input.id)
        .single();

      if (existing) {
        return { success: false, error: "A staff member with this IC number already exists" };
      }
      updates.ic_number = input.icNumber.trim();
    }
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone?.trim() || null;
  }

  if (input.role !== undefined) {
    updates.role = input.role;
  }

  if (input.position !== undefined) {
    updates.position = input.position?.trim() || null;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.zoneId !== undefined) {
    updates.zone_id = input.zoneId || null;
  }

  const { data, error } = await supabase
    .from("staff")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update password in Supabase Auth if provided
  if (input.password?.trim()) {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      
      // Get updated staff data to determine auth email
      const updatedEmail = input.email !== undefined ? input.email : currentStaff.email;
      const updatedIcNumber = input.icNumber !== undefined ? input.icNumber : currentStaff.ic_number;
      const authEmail = getAuthEmail(updatedEmail, updatedIcNumber);
      
      // Find auth user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === authEmail.toLowerCase()
      );

      if (existingUser) {
        // Update existing user password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: input.password.trim(),
          email_confirm: true,
        });
      } else {
        // Create new auth user if doesn't exist
        await supabaseAdmin.auth.admin.createUser({
          email: authEmail.toLowerCase(),
          password: input.password.trim(),
          email_confirm: true,
          user_metadata: {
            full_name: data.name,
            staff_id: data.id,
          },
        });
      }
    } catch (authError) {
      // Log error but don't fail staff update
      console.error("Failed to update auth user password:", authError);
      // Continue - staff record is updated, password update can be retried
    }
  }

  revalidatePath("/admin/staff");
  revalidatePath(`/staff/${input.id}`);
  return { success: true, data: data as Staff };
}

/**
 * Delete a staff member
 * Only super_admin and ADUN can delete staff
 */
export async function deleteStaff(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid staff ID" };
  }

  const supabase = await getSupabaseServerClient();
  const { getCurrentUserAccess } = await import("@/lib/utils/accessControl");

  // Check if user has permission to delete staff
  const access = await getCurrentUserAccess();
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can delete staff" };
  }

  // Check if staff has any assignments
  const { data: assignments } = await supabase
    .from("issue_assignments")
    .select("id")
    .eq("staff_id", id)
    .limit(1);

  if (assignments && assignments.length > 0) {
    return {
      success: false,
      error: "Cannot delete staff member with existing issue assignments. Please reassign or remove assignments first.",
    };
  }

  const { error } = await supabase.from("staff").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Toggle staff status (active/inactive)
 */
export async function toggleStaffStatus(id: number): Promise<ActionResult<Staff>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid staff ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Get current status
  const { data: current, error: fetchError } = await supabase
    .from("staff")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: "Staff member not found" };
  }

  const newStatus = current.status === "active" ? "inactive" : "active";

  const { data, error } = await supabase
    .from("staff")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/staff");
  return { success: true, data: data as Staff };
}
