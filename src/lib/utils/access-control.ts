"use server";

import { 
  getSupabaseReadOnlyClient, 
  getSupabaseServerClient,
  getAuthenticatedUser,
  getAuthenticatedUserReadOnly 
} from "@/lib/supabase/server";

export type UserAccess = {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdun: boolean;
  isZoneLeader: boolean;
  zoneId: number | null;
  staffId: number | null;
  email: string | null;
};

export type WorkspaceType = "admin" | "staff" | "community" | null;

export type WorkspaceAccess = {
  workspaceType: WorkspaceType;
  canAccessAdmin: boolean;
  canAccessStaff: boolean;
  canAccessCommunity: boolean;
};

/**
 * Get the current user's access control information (read-only version for Server Components)
 * This determines what data they can see based on their role:
 * - super_admin: Can see all zones
 * - adun: Can see all zones in their DUN
 * - zone_leader: Can only see their assigned zone
 * - staff_manager/staff: Can see all zones (or restricted based on requirements)
 * 
 * Use this in Server Components (layouts, pages) to avoid cookie modification errors
 */
export async function getCurrentUserAccessReadOnly(): Promise<UserAccess> {
  const supabase = await getSupabaseReadOnlyClient();
  
  // Get current user from Supabase auth (using safe helper)
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return {
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdun: false,
      isZoneLeader: false,
      zoneId: null,
      staffId: null,
      email: null,
    };
  }

  // Find staff record by email
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, role, zone_id, status")
    .eq("email", user.email.toLowerCase().trim())
    .eq("status", "active")
    .single();

  if (staffError || !staff) {
    // User is authenticated but not a staff member
    return {
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdun: false,
      isZoneLeader: false,
      zoneId: null,
      staffId: null,
      email: user.email,
    };
  }

  const isSuperAdmin = staff.role === "super_admin";
  const isAdun = staff.role === "adun";
  const isZoneLeader = staff.role === "zone_leader";

  return {
    isAuthenticated: true,
    isSuperAdmin,
    isAdun,
    isZoneLeader,
    zoneId: staff.zone_id || null,
    staffId: staff.id,
    email: user.email,
  };
}

/**
 * Get the current user's access control information
 * This determines what data they can see based on their role:
 * - super_admin: Can see all zones
 * - adun: Can see all zones in their DUN
 * - zone_leader: Can only see their assigned zone
 * - staff_manager/staff: Can see all zones (or restricted based on requirements)
 * 
 * Use this in Server Actions where cookie modification is allowed
 */
export async function getCurrentUserAccess(): Promise<UserAccess> {
  const supabase = await getSupabaseServerClient();
  
  // Get current user from Supabase auth (using safe helper)
  const user = await getAuthenticatedUser();
  
  if (!user || !user.email) {
    return {
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdun: false,
      isZoneLeader: false,
      zoneId: null,
      staffId: null,
      email: null,
    };
  }

  // Find staff record by email or generated email from IC number
  // First try by email
  let { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, role, zone_id, status, email, ic_number")
    .eq("email", user.email.toLowerCase().trim())
    .eq("status", "active")
    .maybeSingle();

  // If not found by email, check if it's a generated email from IC number
  if (!staff && user.email.endsWith("@staff.local")) {
    const icNumber = user.email.replace("@staff.local", "").replace(/[-\s]/g, "");
    const { data: staffByIc } = await supabase
      .from("staff")
      .select("id, role, zone_id, status, email, ic_number")
      .eq("ic_number", icNumber)
      .eq("status", "active")
      .maybeSingle();
    
    if (staffByIc) {
      staff = staffByIc;
      staffError = null;
    }
  }

  if (staffError || !staff) {
    // User is authenticated but not a staff member
    return {
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdun: false,
      isZoneLeader: false,
      zoneId: null,
      staffId: null,
      email: user.email,
    };
  }

  const isSuperAdmin = staff.role === "super_admin";
  const isAdun = staff.role === "adun";
  const isZoneLeader = staff.role === "zone_leader";

  return {
    isAuthenticated: true,
    isSuperAdmin,
    isAdun,
    isZoneLeader,
    zoneId: staff.zone_id || null,
    staffId: staff.id,
    email: user.email,
  };
}

/**
 * Get zone IDs that the current user can access (read-only version for Server Components)
 * Returns null if user can access all zones (super_admin or adun)
 * Returns array of zone IDs if user is restricted (zone_leader)
 * Use this in Server Components to avoid cookie modification errors
 */
export async function getAccessibleZoneIdsReadOnly(): Promise<number[] | null> {
  const access = await getCurrentUserAccessReadOnly();

  // Super admin and ADUN can see all zones
  if (access.isSuperAdmin || access.isAdun) {
    return null; // null means all zones
  }

  // Zone leaders can only see their assigned zone
  if (access.isZoneLeader && access.zoneId) {
    return [access.zoneId];
  }

  // Default: no access (empty array)
  return [];
}

/**
 * Get zone IDs that the current user can access
 * Returns null if user can access all zones (super_admin or adun)
 * Returns array of zone IDs if user is restricted (zone_leader)
 * Use this in Server Actions where cookie modification is allowed
 */
export async function getAccessibleZoneIds(): Promise<number[] | null> {
  const access = await getCurrentUserAccess();

  // Super admin and ADUN can see all zones
  if (access.isSuperAdmin || access.isAdun) {
    return null; // null means all zones
  }

  // Zone leaders can only see their assigned zone
  if (access.isZoneLeader && access.zoneId) {
    return [access.zoneId];
  }

  // Default: no access (empty array)
  return [];
}

/**
 * Check if user can access a specific zone (read-only version for Server Components)
 */
export async function canAccessZoneReadOnly(zoneId: number): Promise<boolean> {
  const accessibleZones = await getAccessibleZoneIdsReadOnly();
  
  // null means all zones accessible
  if (accessibleZones === null) {
    return true;
  }

  // Check if zoneId is in accessible zones
  return accessibleZones.includes(zoneId);
}

/**
 * Check if user can access a specific zone
 */
export async function canAccessZone(zoneId: number): Promise<boolean> {
  const accessibleZones = await getAccessibleZoneIds();
  
  // null means all zones accessible
  if (accessibleZones === null) {
    return true;
  }

  // Check if zoneId is in accessible zones
  return accessibleZones.includes(zoneId);
}

/**
 * Check if user can access a specific household (read-only version for Server Components)
 */
export async function canAccessHouseholdReadOnly(householdZoneId: number | null): Promise<boolean> {
  if (!householdZoneId) {
    // Households without zones might be accessible to all
    const access = await getCurrentUserAccessReadOnly();
    return access.isSuperAdmin || access.isAdun;
  }

  return canAccessZoneReadOnly(householdZoneId);
}

/**
 * Check if user can access a specific household (by checking its zone)
 */
export async function canAccessHousehold(householdZoneId: number | null): Promise<boolean> {
  if (!householdZoneId) {
    // Households without zones might be accessible to all
    const access = await getCurrentUserAccess();
    return access.isSuperAdmin || access.isAdun;
  }

  return canAccessZone(householdZoneId);
}

/**
 * Check if the current user has a specific permission
 * Super admin and ADUN have all permissions by default
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated || !access.staffId) {
    return false;
  }

  // Super admin and ADUN have all permissions
  if (access.isSuperAdmin || access.isAdun) {
    return true;
  }

  // Check if staff has the permission
  const { hasPermission: checkPermission } = await import("@/lib/actions/permissions");
  return await checkPermission(access.staffId, permissionCode);
}

/**
 * Determine the workspace type for the current user
 * - admin: Users with admin roles (super_admin, adun, zone_leader, staff_manager)
 * - staff: Users with staff role (not admin roles)
 * - community: Users who are not staff members (community users)
 */
export async function getUserWorkspaceType(): Promise<WorkspaceType> {
  const supabase = await getSupabaseReadOnlyClient();
  
  // Get current user from Supabase auth (using safe helper)
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return null;
  }

  // Check if user is a staff member (by email or generated email from IC)
  let { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, role, status, email, ic_number")
    .eq("email", user.email.toLowerCase().trim())
    .eq("status", "active")
    .maybeSingle();

  // If not found by email, check if it's a generated email from IC number
  if (!staff && user.email.endsWith("@staff.local")) {
    const icNumber = user.email.replace("@staff.local", "").replace(/[-\s]/g, "");
    const { data: staffByIc } = await supabase
      .from("staff")
      .select("id, role, status, email, ic_number")
      .eq("ic_number", icNumber)
      .eq("status", "active")
      .maybeSingle();
    
    if (staffByIc) {
      staff = staffByIc;
      staffError = null;
    }
  }

  if (staff && !staffError) {
    // User is a staff member
    const adminRoles = ["super_admin", "adun", "zone_leader", "staff_manager"];
    if (adminRoles.includes(staff.role)) {
      return "admin";
    }
    // Regular staff role
    return "staff";
  }

  // User is not a staff member, check if they're a community user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profile && !profileError) {
    return "community";
  }

  // User exists in auth but not in staff or profiles
  return null;
}

/**
 * Get workspace access information for the current user
 */
export async function getWorkspaceAccess(): Promise<WorkspaceAccess> {
  const workspaceType = await getUserWorkspaceType();
  
  // Admin users can access both admin and staff workspaces
  // Staff users can only access staff workspace
  // Community users can only access community workspace
  return {
    workspaceType,
    canAccessAdmin: workspaceType === "admin",
    canAccessStaff: workspaceType === "admin" || workspaceType === "staff",
    canAccessCommunity: workspaceType === "community",
  };
}
