// "use server"; removed to avoid treating sync utilities as Server Actions

import {
  logAudit,
  inferEventType,
  determineActionType,
  extractEntityId,
  createActionDescription,
} from "./audit";
import type { AuditOptions, AuditEventType } from "./audit-types";

/**
 * Higher-order function to wrap Server Actions with automatic audit logging
 * 
 * @example
 * ```typescript
 * export const createStaff = withAudit(
 *   async (input: CreateStaffInput) => {
 *     // Your implementation
 *     return { success: true, data: staff };
 *   },
 *   {
 *     entityType: "staff",
 *     eventType: "staff.created"
 *   }
 * );
 * ```
 */
export function withAudit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: AuditOptions
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const functionName = fn.name || "anonymous";
    const actionType = determineActionType(functionName);
    const eventType =
      options.eventType || inferEventType(functionName, actionType);
    const entityType = options.entityType;
    const entityId = options.entityId ?? null;

    let result: R;
    let success = true;
    let errorMessage: string | null = null;

    try {
      // Execute the original function
      result = await fn(...args);

      // Extract entity ID from result if not provided
      const finalEntityId =
        entityId ?? extractEntityId(result, args[0] ?? null);

      // Create action description
      const actionDescription =
        options.actionDescription ||
        createActionDescription(functionName, actionType, entityType, result);

      // Prepare metadata
      const metadata: Record<string, unknown> = {
        function: functionName,
        action: actionType,
        ...options.metadata,
      };

      // Add input parameters (sanitized - exclude sensitive data)
      if (args.length > 0) {
        const sanitizedInput = sanitizeInput(args[0]);
        metadata.input = sanitizedInput;
      }

      // Add result summary (if successful)
      if (success && result) {
        const resultSummary = extractResultSummary(result);
        if (resultSummary) {
          metadata.result = resultSummary;
        }
      }

      // Log successful action
      await logAudit(eventType, {
        entityType,
        entityId: finalEntityId,
        action: actionDescription,
        details: metadata,
        success: true,
        // Check if previousData is returned in metadata for diff computation
        previousData: (metadata.previousData as Record<string, unknown>) || undefined,
        // Proioritize explicit newData from metadata, fallback to result data
        newData: (metadata.newData as Record<string, unknown>) || (result as any)?.data || (result as Record<string, unknown>) || undefined,
      });
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed action if configured to do so
      if (options.logOnError !== false) {
        const actionDescription =
          options.actionDescription ||
          `${entityType} operation failed: ${functionName}`;

        await logAudit(eventType, {
          entityType,
          entityId: entityId ?? extractEntityId(null, args[0] ?? {}),
          action: actionDescription,
          details: {
            function: functionName,
            error: errorMessage,
            ...options.metadata,
          },
          success: false,
          errorMessage,
        });
      }

      // Re-throw the error
      throw error;
    }

    return result;
  };
}

/**
 * Sanitize input to remove sensitive data before logging
 */
function sanitizeInput(input: unknown): unknown {
  if (!input || typeof input !== "object") {
    return input;
  }

  const sanitized = { ...(input as Record<string, unknown>) };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "accessToken",
    "refreshToken",
    "creditCard",
    "credit_card",
    "ssn",
    "icNumber", // Malaysian IC number - sensitive
    "ic_number",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Extract a summary from the result for logging
 */
function extractResultSummary(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const resultObj = result as Record<string, unknown>;
  const summary: Record<string, unknown> = {};

  // Extract common fields
  if ("success" in resultObj) {
    summary.success = resultObj.success;
  }

  // If result has data property, extract key fields
  if (resultObj.data && typeof resultObj.data === "object") {
    const data = resultObj.data as Record<string, unknown>;
    if (typeof data.id === "number") {
      summary.id = data.id;
    }
    if (data.name) {
      summary.name = data.name;
    }
    if (data.title) {
      summary.title = data.title;
    }
    if (data.status) {
      summary.status = data.status;
    }
  } else {
    // Direct result object
    if (typeof resultObj.id === "number") {
      summary.id = resultObj.id;
    }
    if (resultObj.name) {
      summary.name = resultObj.name;
    }
    if (resultObj.title) {
      summary.title = resultObj.title;
    }
    if (resultObj.status) {
      summary.status = resultObj.status;
    }
  }

  return Object.keys(summary).length > 0 ? summary : null;
}
