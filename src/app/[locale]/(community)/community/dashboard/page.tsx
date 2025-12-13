import { getSupabaseReadOnlyClient, getAuthenticatedUserReadOnly } from "@/lib/supabase/server";
import Link from "next/link";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import { Bell, Calendar, ChevronRight, FileText, AlertCircle, Megaphone } from "lucide-react";
import { getActiveAnnouncements } from "@/lib/actions/announcements";
import type { Announcement } from "@/lib/actions/announcements";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

function statusBadge(s: string) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", label: "Pending" },
    in_progress: { cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", label: "In Progress" },
    resolved: { cls: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", label: "Resolved" },
    closed: { cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Closed" },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full h-7 px-3 text-xs font-medium ${m.cls}`}>{m.label}</span>;
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
  
  // Get authenticated user from session (this is the real authenticated user)
  const user = await getAuthenticatedUserReadOnly();
  
  // Fetch active announcements (limit to 2 for dashboard)
  const announcementsResult = await getActiveAnnouncements(2);
  const announcements: Announcement[] = announcementsResult.success && announcementsResult.data ? announcementsResult.data : [];
  
  // Get user's profile ID to filter their issues
  // Use the authenticated user's email from the session to find the profile
  let profileId: number | null = null;
  if (user?.id && user?.email) {
    // Query profile using the authenticated user's email from the session
    // This ensures we're using the correct user from auth, not a separate lookup
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", user.email.toLowerCase().trim())
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching profile for authenticated user:", profileError);
    }
    
    profileId = profile?.id ?? null;
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
  let countBuilder = supabase
    .from("issues")
    .select("*", { count: "exact", head: true });
  
  let dataBuilder = supabase
    .from("issues")
    .select("id,title,category,status,created_at");

  // Filter by user's profile ID
  if (profileId) {
    countBuilder = countBuilder.eq("reporter_id", profileId);
    dataBuilder = dataBuilder.eq("reporter_id", profileId);
  } else {
    // If no profile found, return empty results
    countBuilder = countBuilder.eq("reporter_id", -1); // Will return 0
    dataBuilder = dataBuilder.eq("reporter_id", -1); // Will return empty
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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Announcements Section */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Bell className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Announcements</h3>
          </div>
          <Link 
            href={`/${locale}/announcements`}
            className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="size-4" />
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
                  className="rounded-lg bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm p-5 border border-white/20 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg ${getCategoryBgColor(announcement.category)} p-2 mt-0.5 flex-shrink-0`}>
                      {getCategoryIcon(announcement.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {announcement.category && announcement.category !== "general" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary mb-2">
                          {announcement.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      )}
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{truncatedContent}</p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="size-3" />
                          <span>{formatDate(announcement.published_at)}</span>
                        </div>
                        <Link 
                          href={`/${locale}/announcements#announcement-${announcement.id}`}
                          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Read more
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
            <p className="text-sm text-gray-600 dark:text-gray-400">No announcements at the moment.</p>
          </div>
        )}
      </div>

      {/* Issues Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">My Reported Issues</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalCount ? `Total: ${totalCount} issue${totalCount !== 1 ? 's' : ''}` : 'No issues reported yet'}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          <Link 
            href={buildFilterUrl()} 
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              !filter 
                ? "text-primary border-primary" 
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
            }`}
          >
            All
          </Link>
          <Link 
            href={buildFilterUrl("pending")} 
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              filter === "pending" 
                ? "text-primary border-primary" 
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
            }`}
          >
            Pending
          </Link>
          <Link 
            href={buildFilterUrl("in_progress")} 
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              filter === "in_progress" 
                ? "text-primary border-primary" 
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
            }`}
          >
            In Progress
          </Link>
          <Link 
            href={buildFilterUrl("resolved")} 
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              filter === "resolved" 
                ? "text-primary border-primary" 
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
            }`}
          >
            Resolved
          </Link>
        </nav>
      </div>

      {/* Issues Table */}
      <DataTable pagination={pagination}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Issue</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white hidden md:table-cell">Category</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white hidden lg:table-cell">Date Submitted</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Status</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {issues.length > 0 ? (
              issues.map((it) => (
                <tr 
                  key={it.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <Link 
                      href={`/${locale}/community/issues/${it.id}`} 
                      className="text-primary font-semibold hover:text-primary/80 transition-colors inline-flex items-center gap-2"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-none">{it.title}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">#{it.id}</span>
                    </Link>
                    <div className="md:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {it.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} • {new Date(it.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {it.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    {new Date(it.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(it.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/${locale}/community/issues/${it.id}`} 
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      View
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <DataTableEmpty
                colSpan={5}
                icon={<AlertCircle className="size-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />}
                message={
                  filter 
                    ? `No ${filter.replace('_', ' ')} issues found. Submit a new report to see it here.`
                    : "No issues yet. Submit a new report to see it here."
                }
              />
            )}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
