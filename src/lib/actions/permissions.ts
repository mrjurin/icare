"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccess } from "@/lib/utils/access-control";

export type Permission = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffPermission = {
  id: number;
  staff_id: number;
  permission_id: number;
  granted_by: number | null;
  granted_at: string;
  notes: string | null;
  created_at: string;
  staff_name?: string;
  permission_code?: string;
  permission_name?: string;
  granted_by_name?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all available permissions
 * Only super_admin and ADUN can view permissions
 */
export async function getPermissions(): Promise<ActionResult<Permission[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view permissions" };
  }

  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as Permission[] };
}

/**
 * Get permissions for a specific staff member
 */
export async function getStaffPermissions(staffId: number): Promise<ActionResult<StaffPermission[]>> {
  if (!staffId || Number.isNaN(staffId)) {
    return { success: false, error: "Invalid staff ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only super admin and ADUN can view staff permissions
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view permissions" };
  }

  const { data, error } = await supabase
    .from("staff_permissions")
    .select(`
      *,
      staff:staff_id(name),
      permission:permission_id(code, name),
      granted_by_staff:granted_by(name)
    `)
    .eq("staff_id", staffId)
    .order("granted_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const staffPermissions: StaffPermission[] = (data || []).map((item: any) => ({
    id: item.id,
    staff_id: item.staff_id,
    permission_id: item.permission_id,
    granted_by: item.granted_by,
    granted_at: item.granted_at,
    notes: item.notes,
    created_at: item.created_at,
    staff_name: item.staff?.name,
    permission_code: item.permission?.code,
    permission_name: item.permission?.name,
    granted_by_name: item.granted_by_staff?.name,
  }));

  return { success: true, data: staffPermissions };
}

/**
 * Check if a staff member has a specific permission
 */
export async function hasPermission(staffId: number, permissionCode: string): Promise<boolean> {
  if (!staffId || !permissionCode) {
    return false;
  }

  const supabase = await getSupabaseServerClient();

  // First get the permission ID
  const { data: permission } = await supabase
    .from("permissions")
    .select("id")
    .eq("code", permissionCode)
    .single();

  if (!permission) {
    return false;
  }

  // Check if staff has this permission
  const { data } = await supabase
    .from("staff_permissions")
    .select("id")
    .eq("staff_id", staffId)
    .eq("permission_id", permission.id)
    .limit(1)
    .single();

  return !!data;
}

/**
 * Grant a permission to a staff member
 * Only super_admin and ADUN can grant permissions
 */
export async function grantPermission(
  staffId: number,
  permissionId: number,
  notes?: string
): Promise<ActionResult<StaffPermission>> {
  if (!staffId || Number.isNaN(staffId)) {
    return { success: false, error: "Invalid staff ID" };
  }
  if (!permissionId || Number.isNaN(permissionId)) {
    return { success: false, error: "Invalid permission ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only super admin and ADUN can grant permissions
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can grant permissions" };
  }

  if (!access.staffId) {
    return { success: false, error: "Staff ID not found" };
  }

  // Check if staff member exists and is active
  const { data: staff } = await supabase
    .from("staff")
    .select("id, status")
    .eq("id", staffId)
    .single();

  if (!staff) {
    return { success: false, error: "Staff member not found" };
  }

  if (staff.status !== "active") {
    return { success: false, error: "Cannot grant permission to inactive staff member" };
  }

  // Check if permission exists
  const { data: permission } = await supabase
    .from("permissions")
    .select("id")
    .eq("id", permissionId)
    .single();

  if (!permission) {
    return { success: false, error: "Permission not found" };
  }

  // Check if permission is already granted
  const { data: existing } = await supabase
    .from("staff_permissions")
    .select("id")
    .eq("staff_id", staffId)
    .eq("permission_id", permissionId)
    .single();

  if (existing) {
    return { success: false, error: "Permission is already granted to this staff member" };
  }

  // Grant the permission
  const { data, error } = await supabase
    .from("staff_permissions")
    .insert({
      staff_id: staffId,
      permission_id: permissionId,
      granted_by: access.staffId,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/staff");
  revalidatePath(`/staff/${staffId}`);
  return { success: true, data: data as StaffPermission };
}

/**
 * Revoke a permission from a staff member
 * Only super_admin and ADUN can revoke permissions
 */
export async function revokePermission(staffPermissionId: number): Promise<ActionResult> {
  if (!staffPermissionId || Number.isNaN(staffPermissionId)) {
    return { success: false, error: "Invalid permission ID" };
  }

  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  // Only super admin and ADUN can revoke permissions
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can revoke permissions" };
  }

  // Get the staff permission to get staff_id for revalidation
  const { data: staffPermission } = await supabase
    .from("staff_permissions")
    .select("staff_id")
    .eq("id", staffPermissionId)
    .single();

  if (!staffPermission) {
    return { success: false, error: "Permission assignment not found" };
  }

  const { error } = await supabase
    .from("staff_permissions")
    .delete()
    .eq("id", staffPermissionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/staff");
  revalidatePath(`/staff/${staffPermission.staff_id}`);
  return { success: true };
}

/**
 * Get all staff members with their permissions
 */
export async function getAllStaffWithPermissions(): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseServerClient();
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view this" };
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, name, email, role, status")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (staffError) {
    return { success: false, error: staffError.message };
  }

  // Get permissions for each staff member
  const staffWithPermissions = await Promise.all(
    (staff || []).map(async (s) => {
      const { data: permissions } = await supabase
        .from("staff_permissions")
        .select(`
          id,
          permission:permission_id(code, name)
        `)
        .eq("staff_id", s.id);

      return {
        ...s,
        permissions: (permissions || []).map((p: any) => ({
          id: p.id,
          code: p.permission?.code,
          name: p.permission?.name,
        })),
      };
    })
  );

  return { success: true, data: staffWithPermissions };
}
