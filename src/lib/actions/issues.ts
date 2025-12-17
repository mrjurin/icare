"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseActivity, type ActivityType } from "@/lib/utils/activity";
import { getCurrentUserAccess } from "@/lib/utils/access-control";

export type ActionResult = {
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
};

export { type ActivityType } from "@/lib/utils/activity";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export type CreateIssueInput = {
  title: string;
  description: string;
  category?: "road_maintenance" | "drainage" | "public_safety" | "sanitation" | "other" | string;
  issueTypeId?: number;
  address: string;
  lat?: number;
  lng?: number;
  localityId?: number;
  status?: "pending" | "in_progress" | "resolved" | "closed";
  reporterId?: number;
  media?: Array<{ url: string; type?: string; size_bytes?: number }>;
};

/**
 * Create a new issue
 */
import { withAudit } from "@/lib/utils/with-audit";

/**
 * Create a new issue
 */
export const createIssue = withAudit(
  async (input: CreateIssueInput): Promise<ActionResult & { data?: { id: number } }> => {
    // Check authentication
    const access = await getCurrentUserAccess();
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    const supabase = await getSupabaseServerClient();

    // Validate required fields
    if (!input.title?.trim()) {
      return { success: false, error: "Title is required" };
    }
    if (!input.description?.trim()) {
      return { success: false, error: "Description is required" };
    }
    if (!input.category && !input.issueTypeId) {
      return { success: false, error: "Category or Issue Type is required" };
    }
    if (!input.address?.trim()) {
      return { success: false, error: "Address is required" };
    }

    // database constraint will check enum validity, but we default to 'other' if unknown
    const category = input.category || "other";

    // Determine reporter ID
    let reporterId = input.reporterId;
    if (!reporterId && access.email) {
      // Try to find profile by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", access.email)
        .single();

      if (profile) {
        reporterId = profile.id;
      }
    }

    const { data: inserted, error } = await supabase
      .from("issues")
      .insert({
        title: input.title.trim(),
        description: input.description.trim(),
        category: category,
        issue_type_id: input.issueTypeId || null,
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        locality_id: input.localityId || null,
        status: input.status || "pending",
        reporter_id: reporterId || null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (inserted?.id) {
      // Insert media if provided
      if (input.media && input.media.length > 0) {
        try {
          await supabase.from("issue_media").insert(
            input.media.map((m) => ({
              issue_id: inserted.id,
              url: m.url,
              type: (m.type ?? "image").slice(0, 16),
              size_bytes: m.size_bytes ?? null,
            }))
          );
        } catch (mediaError) {
          // Log error but don't fail the issue creation
          console.error("Failed to insert media:", mediaError);
        }
      }

      revalidatePath("/admin/issues");
      revalidatePath("/[locale]/(admin)/admin/issues");
      return { success: true, data: { id: inserted.id } };
    }

    return { success: false, error: "Failed to create issue" };
  },
  {
    entityType: "issue",
    eventType: "issue.created",
    actionDescription: "Created a new issue",
  }
);

/**
 * Log an activity to the issue_feedback table
 * @deprecated Use withAudit instead
 */
async function logActivity(
  issueId: number,
  type: ActivityType,
  message: string,
  metadata?: Record<string, unknown>
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();

  // Store activity as a structured comment
  // Format: [ACTIVITY:type] message
  // The metadata is stored as JSON in the comment for parsing
  const activityComment = metadata
    ? `[ACTIVITY:${type}] ${message} ||${JSON.stringify(metadata)}||`
    : `[ACTIVITY:${type}] ${message}`;

  const { error } = await supabase.from("issue_feedback").insert({
    issue_id: issueId,
    profile_id: null,
    rating: 0,
    comments: activityComment,
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update issue status with activity logging
 */
export const updateIssueStatus = withAudit(
  async (
    issueId: number,
    newStatus: string,
    previousStatus?: string
  ): Promise<ActionResult> => {
    if (!issueId || Number.isNaN(issueId)) {
      return { success: false, error: "Invalid issue ID" };
    }

    const validStatuses = ["pending", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid status value" };
    }

    const supabase = await getSupabaseServerClient();

    // If previous status not provided, fetch it
    let oldStatus = previousStatus;
    if (!oldStatus) {
      const { data: issue } = await supabase
        .from("issues")
        .select("status")
        .eq("id", issueId)
        .single();
      oldStatus = issue?.status;
    }

    // Don't update if status is the same
    if (oldStatus === newStatus) {
      return { success: true };
    }

    const updates: { status: string; resolved_at?: string } = { status: newStatus };
    if (newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase.from("issues").update(updates).eq("id", issueId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log legacy activity for backward compatibility
    const oldLabel = STATUS_LABELS[oldStatus || ""] || oldStatus || "Unknown";
    const newLabel = STATUS_LABELS[newStatus] || newStatus;
    const actionDesc = `Status changed from ${oldLabel} to ${newLabel}`;

    await logActivity(issueId, "status_change", actionDesc, {
      from: oldStatus,
      to: newStatus,
    });

    revalidatePath(`/issues/${issueId}`);
    revalidatePath(`/community/issues/${issueId}`);

    // Return metadata for enhanced audit logging (diffs)
    return {
      success: true,
      metadata: {
        previousData: { status: oldStatus },
        newData: { status: newStatus },
        actionDescription: actionDesc,
      }
    };
  },
  {
    entityType: "issue",
    eventType: "issue.status_changed",
  }
);

/**
 * Assign issue to a user with activity logging
 */
export const assignIssue = withAudit(
  async (
    issueId: number,
    assigneeId: number,
    assigneeName?: string
  ): Promise<ActionResult> => {
    if (!issueId || Number.isNaN(issueId)) {
      return { success: false, error: "Invalid issue ID" };
    }
    if (!assigneeId || Number.isNaN(assigneeId)) {
      return { success: false, error: "Please select an assignee" };
    }

    const supabase = await getSupabaseServerClient();

    // Get assignee name if not provided (from staff table)
    let name = assigneeName;
    if (!name) {
      const { data: staff } = await supabase
        .from("staff")
        .select("name")
        .eq("id", assigneeId)
        .single();
      name = staff?.name || `Staff #${assigneeId}`;
    }

    const { error } = await supabase.from("issue_assignments").insert({
      issue_id: issueId,
      staff_id: assigneeId,
      status: "assigned",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Log legacy activity
    await logActivity(issueId, "assignment", `Assigned to ${name}`, {
      assignee_id: assigneeId,
      assignee_name: name,
    });

    revalidatePath(`/issues/${issueId}`);
    revalidatePath(`/community/issues/${issueId}`);
    return { success: true };
  },
  {
    entityType: "issue",
    eventType: "issue.assigned",
  }
);

/**
 * Add a comment to an issue with activity logging
 */
export const addComment = withAudit(
  async (
    issueId: number,
    comment: string,
    isInternal: boolean = false
  ): Promise<ActionResult> => {
    if (!issueId || Number.isNaN(issueId)) {
      return { success: false, error: "Invalid issue ID" };
    }

    const trimmed = comment.trim();
    if (!trimmed) {
      return { success: false, error: "Comment cannot be empty" };
    }
    if (trimmed.length > 2000) {
      return { success: false, error: "Comment is too long (max 2000 characters)" };
    }

    const supabase = await getSupabaseServerClient();

    // For regular comments, insert directly without the ACTIVITY prefix
    const { error } = await supabase.from("issue_feedback").insert({
      issue_id: issueId,
      profile_id: null,
      rating: 0,
      comments: trimmed,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/issues/${issueId}`);
    revalidatePath(`/community/issues/${issueId}`);
    return { success: true };
  },
  {
    entityType: "issue",
    eventType: "issue.comment_added",
  }
);

/**
 * Get formatted activity list for an issue
 */
export async function getIssueActivity(issueId: number) {
  // Use read-only client since this can be called from Server Components
  const supabase = await getSupabaseReadOnlyClient();

  // Get issue creation date
  const { data: issue } = await supabase
    .from("issues")
    .select("created_at")
    .eq("id", issueId)
    .single();

  // Get all feedback entries
  const { data: feedbackRows } = await supabase
    .from("issue_feedback")
    .select("profile_id,comments,rating,created_at")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false })
    .limit(100);

  const activities: Array<{
    kind: "created" | "status_change" | "assigned" | "comment";
    date: string;
    title: string;
    subtitle?: string;
    metadata?: Record<string, unknown>;
  }> = [];

  // Add issue creation
  if (issue) {
    activities.push({
      kind: "created",
      date: issue.created_at,
      title: "Issue created",
    });
  }

  // Parse feedback entries
  if (feedbackRows) {
    for (const row of feedbackRows) {
      if (!row.comments) continue;

      const parsed = parseActivity(row.comments);

      if (parsed.type === "status_change") {
        activities.push({
          kind: "status_change",
          date: row.created_at,
          title: parsed.message,
          metadata: parsed.metadata,
        });
      } else if (parsed.type === "assignment") {
        activities.push({
          kind: "assigned",
          date: row.created_at,
          title: parsed.message,
          metadata: parsed.metadata,
        });
      } else {
        // Regular user comment
        activities.push({
          kind: "comment",
          date: row.created_at,
          title: parsed.message.length > 100
            ? `${parsed.message.slice(0, 100)}...`
            : parsed.message,
          subtitle: typeof row.rating === "number" && row.rating > 0
            ? `Rating: ${row.rating}`
            : undefined,
        });
      }
    }
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return activities;
}

/**
 * Delete an issue with authorization checks
 * - Admins cannot delete issues created by community users (reporterId is not null)
 * - Community users cannot delete any submitted issues
 */
export const deleteIssue = withAudit(
  async (issueId: number): Promise<ActionResult> => {
    if (!issueId || Number.isNaN(issueId)) {
      return { success: false, error: "Invalid issue ID" };
    }

    const supabase = await getSupabaseServerClient();
    const access = await getCurrentUserAccess();

    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    // Fetch the issue to check its reporterId
    const { data: issue, error: fetchError } = await supabase
      .from("issues")
      .select("reporter_id")
      .eq("id", issueId)
      .single();

    if (fetchError || !issue) {
      return { success: false, error: "Issue not found" };
    }

    // Authorization checks
    if (access.staffId) {
      // User is admin/staff
      // Admins cannot delete issues created by community users
      if (issue.reporter_id !== null) {
        return {
          success: false,
          error: "Access denied: Admins cannot delete issues created by community users",
        };
      }
    } else {
      // User is a community user
      // Community users cannot delete submitted issues
      return {
        success: false,
        error: "Access denied: Community users cannot delete submitted issues",
      };
    }

    // Delete the issue (cascade will handle related records)
    const { error: deleteError } = await supabase.from("issues").delete().eq("id", issueId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/admin/issues");
    revalidatePath("/[locale]/(admin)/admin/issues");
    return { success: true };
  },
  {
    entityType: "issue",
    eventType: "issue.deleted",
  }
);

/**
 * Get all issues with coordinates for map visualization
 */
export async function getIssuesWithCoordinates() {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("issues")
    .select("id, lat, lng, status, category, created_at")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) {
    console.error("Failed to fetch issues with coordinates:", error);
    return [];
  }

  return (data || []).filter(
    (issue) => typeof issue.lat === "number" && typeof issue.lng === "number"
  ) as Array<{
    id: number;
    lat: number;
    lng: number;
    status: string;
    category: string;
    created_at: string;
  }>;
}
