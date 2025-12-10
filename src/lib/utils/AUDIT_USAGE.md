# Audit Logging System - Usage Guide

## Overview

The audit logging system provides comprehensive tracking of all system activities using a wrapper function pattern. This ensures all critical operations are automatically logged without requiring manual audit calls in every function.

## Architecture

1. **`audit-types.ts`** - Type definitions for audit events
2. **`audit.ts`** - Core audit logging functions
3. **`with-audit.ts`** - Higher-order wrapper function for Server Actions
4. **`audit_logs` table** - Database table storing all audit entries

## Basic Usage

### Wrapping a Server Action

Wrap your Server Action function with `withAudit()`:

```typescript
import { withAudit } from "@/lib/utils/with-audit";

// Before (without audit)
export async function createStaff(
  input: CreateStaffInput
): Promise<ActionResult<Staff>> {
  // ... implementation
  return { success: true, data: staff };
}

// After (with audit)
export const createStaff = withAudit(
  async (input: CreateStaffInput): Promise<ActionResult<Staff>> => {
    // ... same implementation
    return { success: true, data: staff };
  },
  {
    entityType: "staff",
    eventType: "staff.created", // Optional - auto-detected if not provided
  }
);
```

### Options

The `withAudit` wrapper accepts these options:

```typescript
{
  entityType: string;           // Required: "staff", "household", "issue", etc.
  entityId?: number | null;    // Optional: Pre-specified entity ID
  eventType?: AuditEventType; // Optional: Auto-detected from function name
  metadata?: Record<string, unknown>; // Optional: Additional context
  logOnError?: boolean;        // Optional: Log failed actions (default: true)
  actionDescription?: string;  // Optional: Custom action description
}
```

## Examples

### Example 1: Creating Staff (Simple)

```typescript
export const createStaff = withAudit(
  async (input: CreateStaffInput): Promise<ActionResult<Staff>> => {
    // Validation
    if (!input.name?.trim()) {
      return { success: false, error: "Name is required" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("staff")
      .insert({ name: input.name.trim(), ... })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Staff };
  },
  {
    entityType: "staff",
    eventType: "staff.created",
  }
);
```

### Example 2: Updating with Custom Metadata

```typescript
export const updateStaff = withAudit(
  async (input: UpdateStaffInput): Promise<ActionResult<Staff>> => {
    // ... implementation
    return { success: true, data: updatedStaff };
  },
  {
    entityType: "staff",
    eventType: "staff.updated",
    metadata: {
      changedFields: ["name", "role"], // Track what changed
      previousRole: oldRole,
    },
  }
);
```

### Example 3: Status Change with Custom Description

```typescript
export const updateIssueStatus = withAudit(
  async (
    issueId: number,
    newStatus: string
  ): Promise<ActionResult> => {
    // ... implementation
    return { success: true };
  },
  {
    entityType: "issue",
    entityId: issueId, // Can be passed dynamically
    eventType: "issue.status_changed",
    actionDescription: `Issue status changed to ${newStatus}`,
    metadata: {
      previousStatus: oldStatus,
      newStatus: newStatus,
    },
  }
);
```

### Example 4: Conditional Logging

```typescript
export const deleteStaff = withAudit(
  async (staffId: number): Promise<ActionResult> => {
    // ... implementation
    return { success: true };
  },
  {
    entityType: "staff",
    entityId: staffId,
    eventType: "staff.deleted",
    logOnError: true, // Log even if deletion fails
  }
);
```

## What Gets Logged

For each wrapped function, the audit system automatically logs:

1. **Event Type** - e.g., "staff.created", "household.updated"
2. **Entity Type** - e.g., "staff", "household", "issue"
3. **Entity ID** - Extracted from result or input
4. **User Information**:
   - User ID (staff ID)
   - User Email
   - User Role (super_admin, adun, zone_leader, etc.)
5. **Action Description** - Human-readable description
6. **Metadata**:
   - Function name
   - Action type (create/update/delete)
   - Input parameters (sanitized - passwords/IC numbers redacted)
   - Result summary (ID, name, status, etc.)
7. **Request Context**:
   - IP Address (if available)
   - User Agent (if available)
8. **Success Status** - Whether the action succeeded
9. **Error Message** - If the action failed

## Security Features

### Automatic Data Sanitization

Sensitive fields are automatically redacted before logging:

- Passwords
- Tokens
- API Keys
- IC Numbers
- Credit Card Numbers
- Other sensitive fields

### Error Handling

- Audit logging failures never break the application
- Errors are logged to console but don't throw
- Failed actions are still logged if `logOnError` is true

## Querying Audit Logs

### Get all audit logs for an entity

```typescript
const { data } = await supabase
  .from("audit_logs")
  .select("*")
  .eq("entity_type", "staff")
  .eq("entity_id", staffId)
  .order("created_at", { ascending: false });
```

### Get audit logs for a user

```typescript
const { data } = await supabase
  .from("audit_logs")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });
```

### Get audit logs by event type

```typescript
const { data } = await supabase
  .from("audit_logs")
  .select("*")
  .eq("event_type", "staff.created")
  .order("created_at", { ascending: false });
```

### Get recent audit logs

```typescript
const { data } = await supabase
  .from("audit_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(100);
```

## Manual Audit Logging

If you need to log audit events manually (outside of Server Actions):

```typescript
import { logAudit } from "@/lib/utils/audit";

await logAudit("staff.created", {
  entityType: "staff",
  entityId: staffId,
  action: "Staff member created",
  details: {
    name: staff.name,
    role: staff.role,
  },
  success: true,
});
```

## Migration

Run the migration to create the audit_logs table:

```bash
# Apply the migration
npx drizzle-kit push
# or
npx drizzle-kit migrate
```

## Best Practices

1. **Wrap all critical Server Actions** - Especially create, update, delete operations
2. **Use descriptive entity types** - Use consistent naming (e.g., "staff", not "Staff" or "staff_member")
3. **Include relevant metadata** - Add context that will be useful for auditing
4. **Don't log sensitive data** - The system auto-redacts, but be mindful
5. **Use specific event types** - Prefer "staff.created" over generic "action.executed"
6. **Test audit logging** - Verify logs are created correctly after implementation

## Event Types Reference

See `audit-types.ts` for the complete list of available event types, including:

- `staff.created`, `staff.updated`, `staff.deleted`
- `adun.created`, `adun.updated`, `adun.subscription_activated`
- `household.created`, `household.updated`, `household.member_added`
- `issue.created`, `issue.status_changed`, `issue.assigned`
- And many more...

## Troubleshooting

### Audit logs not appearing

1. Check database migration was applied
2. Verify function is wrapped with `withAudit`
3. Check console for audit logging errors
4. Ensure user is authenticated (audit requires user context)

### Performance concerns

- Audit logging is asynchronous and non-blocking
- Database indexes are optimized for common queries
- Consider archiving old audit logs periodically

### IP Address/User Agent not captured

- These require request headers which aren't always available in Server Actions
- Consider passing these explicitly from the client if needed
- Or use Next.js middleware for HTTP-level auditing
