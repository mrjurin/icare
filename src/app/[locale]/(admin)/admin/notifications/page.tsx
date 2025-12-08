import { getNotifications } from "@/lib/actions/notifications";
import NotificationsList from "./NotificationsList";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
}

function mapCategoryToType(category: string): "new" | "status" | "system" | "comment" {
  const normalized = category.toLowerCase();
  if (normalized.includes("issue") || normalized.includes("new")) {
    return "new";
  }
  if (normalized.includes("status") || normalized.includes("update")) {
    return "status";
  }
  if (normalized.includes("comment") || normalized.includes("reply")) {
    return "comment";
  }
  return "system";
}

function extractIssueRef(body: string): string | undefined {
  // Try to extract issue ID from body text
  // Look for patterns like "Issue #1234" or "INC-1234" or just a number
  const issueMatch = body.match(/(?:issue\s*#?|inc-?)(\d+)/i);
  if (issueMatch) {
    return issueMatch[1];
  }
  return undefined;
}

export default async function AdminNotificationsPage() {
  const result = await getNotifications({ limit: 100 });
  const dbNotifications = result.success ? result.data || [] : [];

  // Transform database notifications to display format
  const notifications = dbNotifications.map((n) => {
    const issueRef = extractIssueRef(n.body);
    return {
      id: n.id,
      title: n.title,
      subtitle: n.body.length > 100 ? n.body.substring(0, 100) + "..." : n.body,
      timeAgo: formatTimeAgo(n.created_at),
      type: mapCategoryToType(n.category),
      issueRef,
      unread: !n.read,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Notifications</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage alerts for new issues, status changes, and system updates.</p>
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  );
}

