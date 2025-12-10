"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import type {
  AuditLogEntry,
  AuditEventType,
  AuditContext,
  AuditOptions,
} from "./audit-types";

/**
 * Get audit context from current request
 */
async function getAuditContext(): Promise<AuditContext> {
  const access = await getCurrentUserAccess();

  // Try to get IP address and user agent from headers
  // Note: In Server Actions, headers are not directly accessible
  // These will be null unless passed explicitly from the client
  // For production, consider using middleware or passing these values explicitly
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      null;
    userAgent = headersList.get("user-agent") || null;
  } catch {
    // Headers not available in this context
    // This is expected in Server Actions
  }

  return {
    userId: access.staffId,
    userEmail: access.email,
    userRole: access.isSuperAdmin
      ? "super_admin"
      : access.isAdun
        ? "adun"
        : access.isZoneLeader
          ? "zone_leader"
          : null,
    ipAddress,
    userAgent,
  };
}

/**
 * Log an audit event
 */
export async function logAudit(
  eventType: AuditEventType,
  options: {
    entityType: string;
    entityId?: number | null;
    action: string;
    details?: Record<string, unknown> | null;
    success?: boolean;
    errorMessage?: string | null;
    context?: AuditContext;
  }
): Promise<void> {
  try {
    const context = options.context || (await getAuditContext());
    const supabase = await getSupabaseServerClient();

    const auditEntry = {
      event_type: eventType,
      entity_type: options.entityType,
      entity_id: options.entityId ?? null,
      user_id: context.userId ?? null,
      user_email: context.userEmail ?? null,
      user_role: context.userRole ?? null,
      action: options.action,
      details: options.details ? JSON.stringify(options.details) : null,
      ip_address: context.ipAddress ?? null,
      user_agent: context.userAgent ?? null,
      success: options.success ?? true,
      error_message: options.errorMessage ?? null,
    };

    const { error } = await supabase.from("audit_logs").insert(auditEntry);

    if (error) {
      // Don't throw - audit logging failures shouldn't break the application
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    // Silently fail - audit logging should never break the application
    console.error("Error in audit logging:", error);
  }
}

/**
 * Infer event type from function name and action
 */
export function inferEventType(
  functionName: string,
  action: "create" | "update" | "delete" | "other"
): AuditEventType {
  const normalizedName = functionName.toLowerCase();

  // Map common patterns to event types
  if (normalizedName.includes("staff")) {
    if (action === "create") return "staff.created";
    if (action === "update") return "staff.updated";
    if (action === "delete") return "staff.deleted";
  }
  if (normalizedName.includes("adun")) {
    if (action === "create") return "adun.created";
    if (action === "update") return "adun.updated";
    if (action === "delete") return "adun.deleted";
  }
  if (normalizedName.includes("household")) {
    if (action === "create") return "household.created";
    if (action === "update") return "household.updated";
    if (action === "delete") return "household.deleted";
  }
  if (normalizedName.includes("issue")) {
    if (action === "create") return "issue.created";
    if (action === "update") return "issue.updated";
    if (action === "delete") return "issue.deleted";
  }
  if (normalizedName.includes("zone")) {
    if (action === "create") return "zone.created";
    if (action === "update") return "zone.updated";
    if (action === "delete") return "zone.deleted";
  }
  if (normalizedName.includes("village")) {
    if (action === "create") return "village.created";
    if (action === "update") return "village.updated";
    if (action === "delete") return "village.deleted";
  }
  if (normalizedName.includes("aids") || normalizedName.includes("aid")) {
    if (action === "create") return "aids_program.created";
    if (action === "update") return "aids_program.updated";
    if (action === "delete") return "aids_program.deleted";
  }

  // Default fallback
  return "action.executed";
}

/**
 * Determine action type from function name
 */
export function determineActionType(functionName: string): "create" | "update" | "delete" | "other" {
  const normalizedName = functionName.toLowerCase();
  if (normalizedName.includes("create") || normalizedName.includes("add")) {
    return "create";
  }
  if (normalizedName.includes("update") || normalizedName.includes("edit") || normalizedName.includes("modify")) {
    return "update";
  }
  if (normalizedName.includes("delete") || normalizedName.includes("remove")) {
    return "delete";
  }
  return "other";
}

/**
 * Extract entity ID from result or input
 */
export function extractEntityId(
  result: unknown,
  input: unknown
): number | null {
  // Try to extract ID from result
  if (result && typeof result === "object") {
    const resultObj = result as Record<string, unknown>;
    if (typeof resultObj.id === "number") {
      return resultObj.id;
    }
    if (resultObj.data && typeof resultObj.data === "object") {
      const dataObj = resultObj.data as Record<string, unknown>;
      if (typeof dataObj.id === "number") {
        return dataObj.id;
      }
    }
  }

  // Try to extract ID from input
  if (input && typeof input === "object") {
    const inputObj = input as Record<string, unknown>;
    if (typeof inputObj.id === "number") {
      return inputObj.id;
    }
    if (typeof inputObj.entityId === "number") {
      return inputObj.entityId as number;
    }
  }

  return null;
}

/**
 * Create action description from function name and result
 */
export function createActionDescription(
  functionName: string,
  action: "create" | "update" | "delete" | "other",
  entityType: string,
  result: unknown
): string {
  const actionVerb =
    action === "create"
      ? "created"
      : action === "update"
        ? "updated"
        : action === "delete"
          ? "deleted"
          : "executed";

  // Try to get entity identifier from result
  let entityIdentifier = "";
  if (result && typeof result === "object") {
    const resultObj = result as Record<string, unknown>;
    if (resultObj.data && typeof resultObj.data === "object") {
      const data = resultObj.data as Record<string, unknown>;
      if (data.name) {
        entityIdentifier = ` "${data.name}"`;
      } else if (data.title) {
        entityIdentifier = ` "${data.title}"`;
      } else if (typeof data.id === "number") {
        entityIdentifier = ` (ID: ${data.id})`;
      }
    } else if (resultObj.name) {
      entityIdentifier = ` "${resultObj.name}"`;
    } else if (resultObj.title) {
      entityIdentifier = ` "${resultObj.title}"`;
    } else if (typeof resultObj.id === "number") {
      entityIdentifier = ` (ID: ${resultObj.id})`;
    }
  }

  return `${entityType} ${actionVerb}${entityIdentifier}`;
}
