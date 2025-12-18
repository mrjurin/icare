import { getNotificationsForProfile } from "@/lib/actions/notifications";
import CommunityNotificationsList from "./CommunityNotificationsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSupabaseReadOnlyClient, getAuthenticatedUserReadOnly } from "@/lib/supabase/server";

function formatTimeAgo(dateString: string, t: any): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t("timeAgo.justNow");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const key = diffInMinutes === 1 ? "timeAgo.minuteAgo" : "timeAgo.minutesAgo";
    return t(key, { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const key = diffInHours === 1 ? "timeAgo.hourAgo" : "timeAgo.hoursAgo";
    return t(key, { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    const key = diffInDays === 1 ? "timeAgo.dayAgo" : "timeAgo.daysAgo";
    return t(key, { count: diffInDays });
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    const key = diffInWeeks === 1 ? "timeAgo.weekAgo" : "timeAgo.weeksAgo";
    return t(key, { count: diffInWeeks });
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  const key = diffInMonths === 1 ? "timeAgo.monthAgo" : "timeAgo.monthsAgo";
  return t(key, { count: diffInMonths });
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

function translateNotificationTitle(title: string, t: any): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes("your issue has been received") || titleLower === "your issue has been received") {
    return t("messages.issueReceived.title");
  }
  if (titleLower.includes("issue status updated") || titleLower === "issue status updated") {
    return t("messages.issueStatusUpdated.title");
  }
  if (titleLower.includes("issue resolved") || titleLower === "issue resolved") {
    return t("messages.issueResolved.title");
  }
  if (titleLower.includes("new announcement") || titleLower === "new announcement") {
    return t("messages.newAnnouncement.title");
  }
  
  // Return original if no match
  return title;
}

function translateNotificationBody(body: string, t: any): string {
  const bodyLower = body.toLowerCase();
  
  // Extract issue title from body if present (between quotes)
  const issueTitleMatch = body.match(/'([^']+)'/);
  const issueTitle = issueTitleMatch ? issueTitleMatch[1] : "";
  
  // Check for "We have received your report about" pattern
  if (bodyLower.includes("we have received your report about") && issueTitle) {
    return t("messages.issueReceived.body", { issueTitle });
  }
  
  // Check for "is now in progress" pattern
  if (bodyLower.includes("is now in progress") && issueTitle) {
    return t("messages.issueStatusUpdated.body", { issueTitle });
  }
  
  // Check for "has been resolved" pattern
  if (bodyLower.includes("has been resolved") && issueTitle) {
    return t("messages.issueResolved.body", { issueTitle });
  }
  
  // Return original if no match
  return body;
}

export default async function CommunityNotificationsPage({ 
  params 
}: { 
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("notifications");
  
  // Check authentication
  const user = await getAuthenticatedUserReadOnly();
  if (!user) {
    redirect(`/${locale}/community/login`);
  }

  const result = await getNotificationsForProfile({ limit: 100 });
  const dbNotifications = result.success ? result.data || [] : [];

  // Transform database notifications to display format
  const notifications = dbNotifications.map((n) => {
    const issueRef = extractIssueRef(n.body);
    const translatedTitle = translateNotificationTitle(n.title, t);
    const translatedBody = translateNotificationBody(n.body, t);
    const displayBody = translatedBody.length > 100 ? translatedBody.substring(0, 100) + "..." : translatedBody;
    
    return {
      id: n.id,
      title: translatedTitle,
      subtitle: displayBody,
      timeAgo: formatTimeAgo(n.created_at, t),
      type: mapCategoryToType(n.category),
      issueRef,
      unread: !n.read,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>
      </div>

      <CommunityNotificationsList notifications={notifications} locale={locale} />
    </div>
  );
}
