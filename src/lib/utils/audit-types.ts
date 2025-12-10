"use server";

/**
 * Audit event types - comprehensive list of all auditable actions
 */
export type AuditEventType =
  // Staff Management
  | "staff.created"
  | "staff.updated"
  | "staff.deleted"
  | "staff.status_changed"
  | "staff.password_changed"
  | "staff.permission_granted"
  | "staff.permission_revoked"
  // ADUN/Politician Management
  | "adun.created"
  | "adun.updated"
  | "adun.deleted"
  | "adun.subscription_activated"
  | "adun.subscription_deactivated"
  // Zone Management
  | "zone.created"
  | "zone.updated"
  | "zone.deleted"
  // Village Management
  | "village.created"
  | "village.updated"
  | "village.deleted"
  // Household Management
  | "household.created"
  | "household.updated"
  | "household.deleted"
  | "household.member_added"
  | "household.member_removed"
  | "household.member_updated"
  // Issue Management
  | "issue.created"
  | "issue.updated"
  | "issue.deleted"
  | "issue.status_changed"
  | "issue.assigned"
  | "issue.comment_added"
  // Aids Programs
  | "aids_program.created"
  | "aids_program.updated"
  | "aids_program.deleted"
  | "aids_program.activated"
  | "aids_program.deactivated"
  | "aid_distributed"
  // SPR Voters
  | "spr_voter.created"
  | "spr_voter.updated"
  | "spr_voter.deleted"
  | "spr_voter_version.created"
  | "spr_voter_version.imported"
  // Reference Data
  | "reference_data.created"
  | "reference_data.updated"
  | "reference_data.deleted"
  // Roles & Permissions
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "role_assignment.created"
  | "role_assignment.deleted"
  // Settings
  | "setting.updated"
  | "setting.created"
  // Announcements
  | "announcement.created"
  | "announcement.updated"
  | "announcement.deleted"
  | "announcement.published"
  | "announcement.unpublished"
  // Membership Applications
  | "membership_application.created"
  | "membership_application.updated"
  | "membership_application.approved"
  | "membership_application.rejected"
  | "membership_application.zone_reviewed"
  // Authentication & Authorization
  | "user.login"
  | "user.logout"
  | "user.password_reset"
  | "user.email_verified"
  | "access_denied"
  // System Operations
  | "backup.created"
  | "backup.restored"
  | "data.exported"
  | "data.imported"
  // Generic fallback
  | "action.executed";

/**
 * Audit log entry structure
 */
export type AuditLogEntry = {
  id?: number;
  event_type: AuditEventType;
  entity_type: string; // e.g., "staff", "household", "issue"
  entity_id: number | null; // ID of the affected entity
  user_id: number | null; // Staff ID who performed the action
  user_email: string | null; // Email of the user
  user_role: string | null; // Role of the user
  action: string; // Human-readable action description
  details: Record<string, unknown> | null; // Additional context/metadata
  ip_address: string | null; // IP address of the request
  user_agent: string | null; // User agent string
  success: boolean; // Whether the action succeeded
  error_message: string | null; // Error message if action failed
  created_at: string;
};

/**
 * Audit context - information about the current request/user
 */
export type AuditContext = {
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Options for audit logging
 */
export type AuditOptions = {
  /** Entity type (e.g., "staff", "household") */
  entityType: string;
  /** Entity ID if applicable */
  entityId?: number | null;
  /** Custom event type (defaults to auto-detected) */
  eventType?: AuditEventType;
  /** Additional metadata to store */
  metadata?: Record<string, unknown>;
  /** Whether to log even if action fails */
  logOnError?: boolean;
  /** Custom action description */
  actionDescription?: string;
};
