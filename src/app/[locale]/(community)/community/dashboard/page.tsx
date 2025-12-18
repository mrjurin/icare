import { getSupabaseReadOnlyClient, getAuthenticatedUserReadOnly } from "@/lib/supabase/server";
import Link from "next/link";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import { Bell, Calendar, ChevronRight, FileText, AlertCircle, Megaphone, BarChart3, TrendingUp, CheckCircle2, Clock, PieChart } from "lucide-react";
import { getActiveAnnouncements } from "@/lib/actions/announcements";
import type { Announcement } from "@/lib/actions/announcements";
import { getTranslations } from "next-intl/server";
import StatusFilterTabs from "./StatusFilterTabs";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

type StatsIssue = {
  id: number;
  category: string;
  status: string;
  created_at: string;
};

function statusBadge(s: string, t: any) {
  const map: Record<string, { cls: string; labelKey: string }> = {
    pending: { cls: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", labelKey: "status.pending" },
    in_progress: { cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", labelKey: "status.inProgress" },
    resolved: { cls: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", labelKey: "status.resolved" },
    closed: { cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", labelKey: "status.closed" },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full h-7 px-3 text-xs font-medium ${m.cls}`}>{t(m.labelKey)}</span>;
}

export default async function CommunityDashboardPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getSupabaseReadOnlyClient();
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("communityDashboard");
  
  // Get authenticated user from session (this is the real authenticated user)
  const user = await getAuthenticatedUserReadOnly();
  
  // Fetch active announcements (limit to 2 for dashboard)
  const announcementsResult = await getActiveAnnouncements(2);
  const announcements: Announcement[] = announcementsResult.success && announcementsResult.data ? announcementsResult.data : [];
  
  // Get user's profile ID to filter their issues
  // IMPORTANT: Always filter by reporter_id - never show all issues to community users
  // Use the authenticated user's email from the session to find the profile
  let profileId: number | null = null;
  
  // Require authenticated user - if not authenticated, show empty results
  if (!user?.id || !user?.email) {
    // No authenticated user - will filter to show nothing
    profileId = null;
  } else {
    // Query profile using the authenticated user's email from the session
    // This ensures we're using the correct user from auth, not a separate lookup
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", user.email.toLowerCase().trim())
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching profile for authenticated user:", profileError);
      // On error, set to null to ensure no issues are shown
      profileId = null;
    } else {
      profileId = profile?.id ?? null;
    }
  }

  // Pagination parameters
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const currentPage = isNaN(page) || page < 1 ? 1 : page;
  const itemsPerPage = 10;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // Status filter
  const active = typeof sp.status === "string" ? sp.status : undefined;
  const allowed = new Set(["pending", "in_progress", "resolved"]);
  const filter = allowed.has(active ?? "") ? active : undefined;

  // Build query for user's issues
  // CRITICAL: Always filter by reporter_id - community users should ONLY see their own issues
  let countBuilder = supabase
    .from("issues")
    .select("*", { count: "exact", head: true });
  
  let dataBuilder = supabase
    .from("issues")
    .select("id,title,category,status,created_at");

  // ALWAYS filter by user's profile ID - never show all issues
  if (profileId) {
    // User has a profile - filter by their reporter_id
    countBuilder = countBuilder.eq("reporter_id", profileId);
    dataBuilder = dataBuilder.eq("reporter_id", profileId);
  } else {
    // No profile found or user not authenticated - return empty results
    // Use impossible ID to ensure no issues are returned
    countBuilder = countBuilder.eq("reporter_id", -1); // Will return 0
    dataBuilder = dataBuilder.eq("reporter_id", -1); // Will return empty array
  }

  // Apply status filter
  if (filter) {
    countBuilder = countBuilder.eq("status", filter);
    dataBuilder = dataBuilder.eq("status", filter);
  }

  // Apply sorting and pagination (order must be before range)
  dataBuilder = dataBuilder
    .order("created_at", { ascending: false })
    .range(from, to);

  const { count: totalCount } = await countBuilder;
  const { data } = await dataBuilder;
  const issues: DbIssue[] = Array.isArray(data) ? data : [];

  // Calculate pagination
  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 0;
  const pagination: PaginationProps | undefined = totalPages > 1 ? {
    currentPage: currentPage,
    totalPages: totalPages,
    totalItems: totalCount || 0,
    itemsPerPage: itemsPerPage,
    baseUrl: `/${locale}/community/dashboard`,
  } : undefined;

  // Build filter URLs with locale
  const buildFilterUrl = (status?: string) => {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
      // Reset to page 1 when changing status filter (page param not included)
    } else {
      // For "All" filter, preserve current page if > 1
      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      }
    }
    const query = params.toString();
    return `/${locale}/community/dashboard${query ? `?${query}` : ""}`;
  };

  // Fetch statistics for charts and summary
  // CRITICAL: Always filter statistics by reporter_id - only show user's own issues
  let statsBuilder = supabase
    .from("issues")
    .select("id,status,category,created_at");

  // ALWAYS filter by user's profile ID - never show all issues in statistics
  if (profileId) {
    statsBuilder = statsBuilder.eq("reporter_id", profileId);
  } else {
    // No profile - return empty results for statistics
    statsBuilder = statsBuilder.eq("reporter_id", -1);
  }

  const { data: allIssues } = await statsBuilder;
  const allUserIssues: StatsIssue[] = Array.isArray(allIssues) ? allIssues : [];

  // Calculate statistics
  const totalIssues = allUserIssues.length;
  const pendingCount = allUserIssues.filter(i => i.status === "pending").length;
  const inProgressCount = allUserIssues.filter(i => i.status === "in_progress").length;
  const resolvedCount = allUserIssues.filter(i => i.status === "resolved" || i.status === "closed").length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  allUserIssues.forEach(issue => {
    const category = issue.category || "other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Monthly trends (last 6 months)
  const now = new Date();
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    
    const count = allUserIssues.filter(issue => {
      const issueDate = new Date(issue.created_at);
      return issueDate >= monthStart && issueDate <= monthEnd;
    }).length;
    
    monthlyData.push({ month: monthKey, count });
  }

  // Calculate resolution rate
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

  // Get most common category
  const mostCommonCategory = Object.keys(categoryCounts).length > 0
    ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Announcements Section */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-lg bg-primary/20 p-1.5 sm:p-2">
              <Bell className="size-4 sm:size-5 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t("recentAnnouncements")}</h3>
          </div>
          <Link 
            href={`/${locale}/announcements`}
            className="text-primary text-xs sm:text-sm font-semibold hover:text-primary/80 transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            {t("viewAll")}
            <ChevronRight className="size-3 sm:size-4" />
          </Link>
        </div>
        {announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((announcement) => {
              const getCategoryIcon = (category: string) => {
                switch (category) {
                  case "maintenance":
                    return <FileText className="size-4 text-blue-600 dark:text-blue-400" />;
                  case "event":
                    return <Calendar className="size-4 text-green-600 dark:text-green-400" />;
                  default:
                    return <Megaphone className="size-4 text-primary" />;
                }
              };
              
              const getCategoryBgColor = (category: string) => {
                switch (category) {
                  case "maintenance":
                    return "bg-blue-100 dark:bg-blue-900/30";
                  case "event":
                    return "bg-green-100 dark:bg-green-900/30";
                  default:
                    return "bg-primary/20";
                }
              };
              
              const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              };
              
              // Truncate content to 150 characters
              const truncatedContent = announcement.content.length > 150
                ? announcement.content.substring(0, 150) + "..."
                : announcement.content;
              
              return (
                <div 
                  key={announcement.id}
                  className="rounded-lg bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm p-4 sm:p-5 border border-white/20 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`rounded-lg ${getCategoryBgColor(announcement.category)} p-1.5 sm:p-2 mt-0.5 flex-shrink-0`}>
                      {getCategoryIcon(announcement.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {announcement.category && announcement.category !== "general" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary mb-2">
                          {announcement.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      )}
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">{announcement.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">{truncatedContent}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="size-3" />
                          <span>{formatDate(announcement.published_at)}</span>
                        </div>
                        <Link 
                          href={`/${locale}/announcements#announcement-${announcement.id}`}
                          className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
                        >
                          {t("readMore")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Megaphone className="size-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("noAnnouncements")}</p>
          </div>
        )}
      </div>

      {/* Statistics Cards Section */}
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t("statistics.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <FileText className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t("statistics.totalIssues")}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalIssues}</p>
          </div>
          
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
                <Clock className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t("statistics.pending")}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
          </div>
          
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t("statistics.inProgress")}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{inProgressCount}</p>
          </div>
          
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t("statistics.resolved")}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t("charts.title")}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("charts.statusDistribution")}</h3>
            </div>
            {totalIssues > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Pie Chart SVG */}
                <div className="flex-shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-sm">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {(() => {
                      const statusData = [
                        { status: "pending", count: pendingCount, color: "#f97316", label: t("status.pending") },
                        { status: "in_progress", count: inProgressCount, color: "#3b82f6", label: t("status.inProgress") },
                        { status: "resolved", count: resolvedCount, color: "#22c55e", label: t("status.resolved") },
                      ].filter(item => item.count > 0);
                      
                      const radius = 70;
                      const circumference = 2 * Math.PI * radius;
                      let currentOffset = 0;
                      
                      return statusData.map((item, index) => {
                        const percentage = totalIssues > 0 ? (item.count / totalIssues) : 0;
                        const dashLength = circumference * percentage;
                        const offset = -currentOffset;
                        currentOffset += dashLength;
                        
                        return (
                          <circle
                            key={item.status}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${dashLength} ${circumference}`}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 80 80)"
                            className="transition-all hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-3 min-w-0">
                  {[
                    { status: "pending", count: pendingCount, color: "#f97316", label: t("status.pending") },
                    { status: "in_progress", count: inProgressCount, color: "#3b82f6", label: t("status.inProgress") },
                    { status: "resolved", count: resolvedCount, color: "#22c55e", label: t("status.resolved") },
                  ].filter(item => item.count > 0).map((item) => {
                    const percentage = totalIssues > 0 ? (item.count / totalIssues) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">
                              {item.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t("charts.noData")}</p>
            )}
          </div>

          {/* Category Breakdown Chart */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("charts.categoryBreakdown")}</h3>
            </div>
            {Object.keys(categoryCounts).length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Pie Chart SVG */}
                <div className="flex-shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-sm">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {(() => {
                      const categoryColors = [
                        "#137fec", // primary blue
                        "#f97316", // orange
                        "#22c55e", // green
                        "#a855f7", // purple
                        "#ef4444", // red
                        "#06b6d4", // cyan
                        "#f59e0b", // amber
                        "#ec4899", // pink
                      ];
                      
                      const categoryData = Object.entries(categoryCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, count], index) => ({
                          category,
                          count,
                          color: categoryColors[index % categoryColors.length],
                          label: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                        }))
                        .filter(item => item.count > 0);
                      
                      const radius = 70;
                      const circumference = 2 * Math.PI * radius;
                      let currentOffset = 0;
                      
                      return categoryData.map((item) => {
                        const percentage = totalIssues > 0 ? (item.count / totalIssues) : 0;
                        const dashLength = circumference * percentage;
                        const offset = -currentOffset;
                        currentOffset += dashLength;
                        
                        return (
                          <circle
                            key={item.category}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${dashLength} ${circumference}`}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 80 80)"
                            className="transition-all hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-3 min-w-0">
                  {(() => {
                    const categoryColors = [
                      "#137fec", // primary blue
                      "#f97316", // orange
                      "#22c55e", // green
                      "#a855f7", // purple
                      "#ef4444", // red
                      "#06b6d4", // cyan
                      "#f59e0b", // amber
                      "#ec4899", // pink
                    ];
                    
                    return Object.entries(categoryCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count], index) => {
                        const percentage = totalIssues > 0 ? (count / totalIssues) * 100 : 0;
                        const categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                        const color = categoryColors[index % categoryColors.length];
                        
                        return (
                          <div key={category} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{categoryLabel}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t("charts.noData")}</p>
            )}
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("charts.monthlyTrends")}</h3>
          </div>
          {monthlyData.some(d => d.count > 0) ? (
            <div className="w-full">
              {/* Line Chart SVG */}
              <div className="w-full h-64 mb-4">
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#137fec" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = 40 + (i * 35);
                    return (
                      <line
                        key={`grid-h-${i}`}
                        x1="60"
                        y1={y}
                        x2="560"
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-200 dark:text-gray-700"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                  
                  {/* Calculate chart dimensions */}
                  {(() => {
                    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
                    const chartWidth = 600 - padding.left - padding.right;
                    const chartHeight = 200 - padding.top - padding.bottom;
                    const maxCount = Math.max(...monthlyData.map(d => d.count), 1);
                    const stepX = chartWidth / (monthlyData.length - 1 || 1);
                    
                    // Generate path for line
                    const points = monthlyData.map((item, index) => {
                      const x = padding.left + (index * stepX);
                      const y = padding.top + chartHeight - ((item.count / maxCount) * chartHeight);
                      return { x, y, count: item.count, month: item.month };
                    });
                    
                    // Create smooth line path
                    const pathData = points.map((point, index) => {
                      if (index === 0) return `M ${point.x} ${point.y}`;
                      
                      const prevPoint = points[index - 1];
                      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2;
                      const cp1y = prevPoint.y;
                      const cp2x = prevPoint.x + (point.x - prevPoint.x) / 2;
                      const cp2y = point.y;
                      
                      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
                    }).join(' ');
                    
                    // Create area path for gradient fill
                    const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
                    
                    return (
                      <>
                        {/* Gradient fill area */}
                        <path
                          d={areaPath}
                          fill="url(#lineGradient)"
                          className="opacity-50"
                        />
                        
                        {/* Line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#137fec"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-sm"
                        />
                        
                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={`point-${index}`}>
                            {/* Circle */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="5"
                              fill="#137fec"
                              stroke="white"
                              strokeWidth="2"
                              className="drop-shadow-sm dark:stroke-gray-900"
                            />
                            {/* Hover area (larger invisible circle for better interaction) */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="12"
                              fill="transparent"
                            />
                            {/* Tooltip */}
                            <g className="opacity-0 hover:opacity-100 transition-opacity">
                              <rect
                                x={point.x - 30}
                                y={point.y - 35}
                                width="60"
                                height="24"
                                rx="4"
                                fill="#137fec"
                                className="dark:fill-gray-800"
                              />
                              <text
                                x={point.x}
                                y={point.y - 18}
                                textAnchor="middle"
                                fill="white"
                                fontSize="12"
                                fontWeight="600"
                                className="dark:fill-white"
                              >
                                {point.count}
                              </text>
                            </g>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
              
              {/* Month labels */}
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
                {monthlyData.map((item) => (
                  <div key={item.month} className="flex flex-col items-center">
                    <span className="font-medium">{item.month}</span>
                    <span className="text-gray-500 dark:text-gray-500 mt-1">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t("charts.noData")}</p>
          )}
        </div>
      </div>

      {/* Informative Summary Section */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-primary/20 p-2">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t("summary.title")}</h3>
        </div>
        <div className="space-y-4">
          {totalIssues > 0 ? (
            <>
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t("summary.resolutionRate", { rate: resolutionRate })}
                </p>
              </div>
              {mostCommonCategory && (
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t("summary.mostCommonCategory", { 
                      category: mostCommonCategory[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      count: mostCommonCategory[1]
                    })}
                  </p>
                </div>
              )}
              {resolvedCount > 0 && (
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t("summary.resolvedIssues", { count: resolvedCount })}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">{t("summary.noIssues")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Issues Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{t("myReportedIssues")}</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalCount ? t("totalIssues", { count: totalCount }) : t("noIssuesReported")}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <StatusFilterTabs currentFilter={filter} locale={locale} />

      {/* Issues Table */}
      <DataTable pagination={pagination}>
        <table className="w-full text-sm" style={{ minWidth: '800px' }}>
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">{t("table.issue")}</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">{t("table.category")}</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">{t("table.dateSubmitted")}</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">{t("table.status")}</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {issues.length > 0 ? (
              issues.map((it) => (
                <tr 
                  key={it.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                >
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <Link 
                      href={`/${locale}/community/issues/${it.id}`} 
                      className="text-primary font-semibold hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 sm:gap-2"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">{it.title}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs flex-shrink-0">#{it.id}</span>
                    </Link>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                    {it.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                    {new Date(it.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {statusBadge(it.status, t)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                    <Link 
                      href={`/${locale}/community/issues/${it.id}`} 
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {t("table.view")}
                      <ChevronRight className="size-3 sm:size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <DataTableEmpty
                colSpan={5}
                icon={<AlertCircle className="size-10 sm:size-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />}
                message={
                  filter 
                    ? t("empty.noFilteredIssues", { filter: t(`status.${filter === 'in_progress' ? 'inProgress' : filter}`) })
                    : t("empty.noIssues")
                }
              />
            )}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
