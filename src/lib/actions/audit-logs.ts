"use server";

import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import type { ActionResult } from "./staff";

export type AuditLog = {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: number | null;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  details: string | null; // JSON string
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  // Joined data
  user_name?: string | null;
};

export type AuditLogFilters = {
  search?: string;
  eventType?: string;
  entityType?: string;
  entityId?: number;
  userId?: number;
  userEmail?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type AuditLogStats = {
  total: number;
  byEventType: Array<{ event_type: string; count: number }>;
  byEntityType: Array<{ entity_type: string; count: number }>;
  byUser: Array<{ user_id: number; user_email: string; user_name: string; count: number }>;
  bySuccess: { success: number; failed: number };
  recentActivity: Array<{ date: string; count: number }>;
};

export type PaginatedAuditLogs = {
  data: AuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Get audit logs with filtering and pagination
 * Only super_admin and ADUN can view audit logs
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<ActionResult<PaginatedAuditLogs>> {
  const access = await getCurrentUserAccess();

  // Only super_admin and ADUN can view audit logs
  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can view audit logs",
    };
  }

  const supabase = await getSupabaseReadOnlyClient();
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from("audit_logs")
    .select(
      `*,
      user:staff!audit_logs_user_id_staff_id_fk(id, name, email)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.entityId !== undefined) {
    query = query.eq("entity_id", filters.entityId);
  }

  if (filters.userId !== undefined) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.userEmail) {
    query = query.ilike("user_email", `%${filters.userEmail}%`);
  }

  if (filters.success !== undefined) {
    query = query.eq("success", filters.success);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  // Search filter (searches in action, user_email, event_type)
  if (filters.search) {
    query = query.or(
      `action.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,event_type.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`
    );
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Transform data to include user name
  const logs: AuditLog[] =
    data?.map((log: any) => {
      const userData = Array.isArray(log.user) ? log.user[0] : log.user;
      return {
        ...log,
        user_name: userData?.name || null,
        user: undefined, // Remove the joined user object
      };
    }) || [];

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return {
    success: true,
    data: {
      data: logs,
      page,
      limit,
      total: count || 0,
      totalPages,
    },
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  startDate?: string,
  endDate?: string
): Promise<ActionResult<AuditLogStats>> {
  const access = await getCurrentUserAccess();

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can view audit statistics",
    };
  }

  const supabase = await getSupabaseReadOnlyClient();

  // Base query with date filters
  let baseQuery = supabase.from("audit_logs").select("*");

  if (startDate) {
    baseQuery = baseQuery.gte("created_at", startDate);
  }
  if (endDate) {
    baseQuery = baseQuery.lte("created_at", endDate);
  }

  // Get total count
  const { count: total, error: totalError } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    return { success: false, error: totalError.message };
  }

  // Get all logs for stats
  const { data: allLogs, error: logsError } = await baseQuery;

  if (logsError) {
    return { success: false, error: logsError.message };
  }

  // Calculate statistics
  const byEventType = new Map<string, number>();
  const byEntityType = new Map<string, number>();
  const byUser = new Map<
    number,
    { email: string; name: string; count: number }
  >();
  let successCount = 0;
  let failedCount = 0;
  const recentActivity = new Map<string, number>();

  allLogs?.forEach((log) => {
    // By event type
    byEventType.set(
      log.event_type,
      (byEventType.get(log.event_type) || 0) + 1
    );

    // By entity type
    byEntityType.set(
      log.entity_type,
      (byEntityType.get(log.entity_type) || 0) + 1
    );

    // By user
    if (log.user_id) {
      const userKey = log.user_id;
      const existing = byUser.get(userKey) || {
        email: log.user_email || "",
        name: "",
        count: 0,
      };
      existing.count++;
      byUser.set(userKey, existing);
    }

    // By success
    if (log.success) {
      successCount++;
    } else {
      failedCount++;
    }

    // Recent activity (by date)
    const date = log.created_at.split("T")[0];
    recentActivity.set(date, (recentActivity.get(date) || 0) + 1);
  });

  // Get user names
  const userIds = Array.from(byUser.keys());
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("staff")
      .select("id, name")
      .in("id", userIds);

    users?.forEach((user) => {
      const userStat = byUser.get(user.id);
      if (userStat) {
        userStat.name = user.name;
        byUser.set(user.id, userStat);
      }
    });
  }

  // Convert maps to arrays and sort
  const stats: AuditLogStats = {
    total: total || 0,
    byEventType: Array.from(byEventType.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byEntityType: Array.from(byEntityType.entries())
      .map(([entity_type, count]) => ({ entity_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byUser: Array.from(byUser.entries())
      .map(([user_id, data]) => ({
        user_id,
        user_email: data.email,
        user_name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    bySuccess: {
      success: successCount,
      failed: failedCount,
    },
    recentActivity: Array.from(recentActivity.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30),
  };

  return { success: true, data: stats };
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(
  filters: AuditLogFilters = {}
): Promise<ActionResult<{ csv: string }>> {
  const access = await getCurrentUserAccess();

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can export audit logs",
    };
  }

  // Get all logs (no pagination for export)
  const result = await getAuditLogs({ ...filters, limit: 10000 });

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Failed to fetch audit logs" };
  }

  // Convert to CSV
  const headers = [
    "ID",
    "Event Type",
    "Entity Type",
    "Entity ID",
    "User ID",
    "User Email",
    "User Name",
    "User Role",
    "Action",
    "Success",
    "Error Message",
    "IP Address",
    "Created At",
  ];

  const rows = result.data.data.map((log) => [
    log.id.toString(),
    log.event_type,
    log.entity_type,
    log.entity_id?.toString() || "",
    log.user_id?.toString() || "",
    log.user_email || "",
    log.user_name || "",
    log.user_role || "",
    `"${log.action.replace(/"/g, '""')}"`, // Escape quotes in CSV
    log.success ? "Yes" : "No",
    log.error_message ? `"${log.error_message.replace(/"/g, '""')}"` : "",
    log.ip_address || "",
    log.created_at,
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return { success: true, data: { csv } };
}

/**
 * Get available filter options (for dropdowns)
 */
export async function getAuditLogFilterOptions(): Promise<
  ActionResult<{
    eventTypes: string[];
    entityTypes: string[];
    users: Array<{ id: number; email: string; name: string }>;
  }>
> {
  const access = await getCurrentUserAccess();

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied",
    };
  }

  const supabase = await getSupabaseReadOnlyClient();

  // Get distinct event types
  const { data: eventTypesData } = await supabase
    .from("audit_logs")
    .select("event_type")
    .order("event_type");

  // Get distinct entity types
  const { data: entityTypesData } = await supabase
    .from("audit_logs")
    .select("entity_type")
    .order("entity_type");

  // Get users who have audit logs
  const { data: usersData } = await supabase
    .from("audit_logs")
    .select("user_id, user_email")
    .not("user_id", "is", null)
    .order("user_email");

  const eventTypes = [
    ...new Set(eventTypesData?.map((e) => e.event_type) || []),
  ];
  const entityTypes = [
    ...new Set(entityTypesData?.map((e) => e.entity_type) || []),
  ];

  // Get user details
  const userIds = [
    ...new Set(usersData?.map((u) => u.user_id).filter(Boolean) || []),
  ];
  const { data: users } = await supabase
    .from("staff")
    .select("id, email, name")
    .in("id", userIds);

  return {
    success: true,
    data: {
      eventTypes,
      entityTypes,
      users: (users || []).map((u) => ({
        id: u.id,
        email: u.email || "",
        name: u.name,
      })),
    },
  };
}
