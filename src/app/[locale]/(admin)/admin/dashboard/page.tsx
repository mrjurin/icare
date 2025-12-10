import { Suspense } from "react";
import { getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";
import { getAdunDashboardStats, getAdunDashboardStatsFromSpr } from "@/lib/actions/reports";
import ReportsTable from "./ReportsTable";
import { getTranslations } from "next-intl/server";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import DashboardTabs from "./DashboardTabs";
import AdunDashboardContent from "./AdunDashboardContent";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("dashboard");
  const access = await getCurrentUserAccessReadOnly();
  const isAdun = access.isAdun;
  const isSuperAdmin = access.isSuperAdmin;
  const showAdunDashboard = isAdun || isSuperAdmin;

  // Get ADUN dashboard statistics if user is ADUN or super admin
  let adunStats = null;
  let sprStats = null;
  if (showAdunDashboard) {
    const statsResult = await getAdunDashboardStats();
    if (statsResult.success && statsResult.data) {
      adunStats = statsResult.data;
    }
    
    // Get SPR-based statistics
    const sprStatsResult = await getAdunDashboardStatsFromSpr();
    if (sprStatsResult.success && sprStatsResult.data) {
      sprStats = sprStatsResult.data;
    }
  }

  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const limit = typeof params.limit === "string" ? parseInt(params.limit, 10) : 10;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {showAdunDashboard ? t("adunDashboard") : t("adminDashboard")}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {showAdunDashboard ? t("adunDescription") : t("adminDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            {t("export")}
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("statistics")}
        </h2>
        {showAdunDashboard && (adunStats || sprStats) ? (
          <DashboardTabs
            householdContent={<AdunDashboardContent stats={adunStats} />}
            sprContent={<AdunDashboardContent stats={sprStats} />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {labelKey:"pending",value:"128"},
              {labelKey:"inReview",value:"42"},
              {labelKey:"resolved",value:"950"},
              {labelKey:"overdue",value:"17"},
            ].map((k, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t(k.labelKey)}</p>
                <p className="text-3xl font-bold text-primary">{k.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Issues Table Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("recentIssues")}
          </h2>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
            <div className="text-gray-500 dark:text-gray-400">{t("loadingReports")}</div>
          </div>
        }>
          <ReportsTableWrapper page={page} limit={limit} />
        </Suspense>
      </section>
    </div>
  );
}

async function ReportsTableWrapper({ page, limit }: { page: number; limit: number }) {
  const supabase = await getSupabaseReadOnlyClient();
  
  // Validate pagination parameters
  const currentPage = isNaN(page) || page < 1 ? 1 : page;
  const itemsPerPage = isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100); // Max 100 items per page
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // Fetch total count
  const { count: totalCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true });

  // Fetch paginated issues for admin - no filtering by reporter_id
  // Admin users should see all issues regardless of who reported them
  const { data: issues } = await supabase
    .from("issues")
    .select("id, title, category, status, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!issues || issues.length === 0) {
    const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 0;
    return (
      <ReportsTable
        initialReports={[]}
        pagination={{
          currentPage: currentPage,
          totalPages: totalPages,
          totalItems: totalCount || 0,
          itemsPerPage: itemsPerPage,
        }}
      />
    );
  }

  // Fetch issue assignments
  const issueIds = issues.map((i: any) => i.id);
  const { data: assignments } = await supabase
    .from("issue_assignments")
    .select("issue_id, staff_id")
    .in("issue_id", issueIds);

  // Get unique staff IDs
  const staffIds = [...new Set((assignments || []).map((a: any) => a.staff_id).filter(Boolean))];
  
  // Fetch staff profiles
  const { data: staffProfiles } = await supabase
    .from("staff")
    .select("id, user_id")
    .in("id", staffIds.length > 0 ? staffIds : [-1]);

  // Get user IDs from staff
  const userIds = [...new Set((staffProfiles || []).map((s: any) => s.user_id).filter(Boolean))];
  
  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds.length > 0 ? userIds : [-1]);

  // Create maps for lookups
  const staffToUserMap = new Map<number, number>();
  (staffProfiles || []).forEach((staff: any) => {
    if (staff.user_id) {
      staffToUserMap.set(staff.id, staff.user_id);
    }
  });

  const userToNameMap = new Map<number, string>();
  (profiles || []).forEach((profile: any) => {
    if (profile.full_name) {
      userToNameMap.set(profile.id, profile.full_name);
    }
  });

  // Create a map of issue_id to assignee name
  const assigneeMap = new Map<number, string>();
  (assignments || []).forEach((assignment: any) => {
    if (assignment.staff_id) {
      const userId = staffToUserMap.get(assignment.staff_id);
      if (userId) {
        const name = userToNameMap.get(userId);
        if (name) {
          assigneeMap.set(assignment.issue_id, name);
        }
      }
    }
  });

  // Transform the data to match ReportsTable format
  const reports = issues.map((issue: any) => {
    // Get assignee name
    const assignee = assigneeMap.get(issue.id) || "Unassigned";

    // Map status from database format to display format
    let displayStatus = issue.status;
    if (issue.status === "pending") displayStatus = "Pending";
    else if (issue.status === "in_progress") displayStatus = "In Review";
    else if (issue.status === "resolved") displayStatus = "Resolved";
    else if (issue.status === "closed") displayStatus = "Resolved";

    return {
      id: `#${issue.id}`,
      title: issue.title,
      cat: issue.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      status: displayStatus,
      created: new Date(issue.created_at).toISOString().split("T")[0],
      assignee: assignee,
    };
  });

  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 0;

  return (
    <ReportsTable
      initialReports={reports}
      pagination={{
        currentPage: currentPage,
        totalPages: totalPages,
        totalItems: totalCount || 0,
        itemsPerPage: itemsPerPage,
      }}
    />
  );
}
