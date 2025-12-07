export type ActivityType = "status_change" | "comment" | "assignment";

export type ParsedActivity = {
  type: ActivityType | "user_comment";
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Parse activity from a feedback comment
 */
export function parseActivity(comment: string): ParsedActivity {
  const activityMatch = comment.match(/^\[ACTIVITY:(\w+)\]\s*(.+?)(?:\s*\|\|(.+)\|\|)?$/);

  if (activityMatch) {
    const [, type, message, metadataStr] = activityMatch;
    let metadata: Record<string, unknown> | undefined;

    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      type: type as ActivityType,
      message: message.trim(),
      metadata,
    };
  }

  return {
    type: "user_comment",
    message: comment,
  };
}
