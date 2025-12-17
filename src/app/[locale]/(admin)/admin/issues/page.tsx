import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getIssuesWithCoordinates } from "@/lib/actions/issues";
import IssueDensityMap from "@/components/issues/IssueDensityMap";
import Pagination from "@/components/ui/Pagination";
import IssuesFilters from "./IssuesFilters";
import IssuesTable from "./IssuesTable";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  reporter_id: number | null;
  reporter_name: string | null;
};

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("issues.list");
  const params = await searchParams;

  // Parse filters
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const categoryFilter = typeof params.category === "string" ? params.category : undefined;
  const assignedFilter = typeof params.assigned === "string" ? params.assigned : undefined;
  const searchQuery = typeof params.search === "string" ? params.search : undefined;
  const fromDate = typeof params.from === "string" ? params.from : undefined;
  const toDate = typeof params.to === "string" ? params.to : undefined;

  // Parse pagination
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const itemsPerPage = 10;
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const supabase = await getSupabaseReadOnlyClient();

  // Fetch counters (keep existing logic for top counters)
  const { count: totalOpenCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress", "resolved"]);

  const { count: pendingCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const { count: resolvedThisWeekCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved")
    .gte("resolved_at", startOfWeek.toISOString());

  const counters = [
    { label: t("counters.totalOpenIssues"), value: String(totalOpenCount || 0) },
    { label: t("counters.pendingReview"), value: String(pendingCount || 0) },
    { label: t("counters.resolvedThisWeek"), value: String(resolvedThisWeekCount || 0) },
  ];

  // Build main query
  let query = supabase
    .from("issues")
    .select("id,title,category,status,created_at,reporter_id", { count: "exact" });

  // Apply filters
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  if (assignedFilter) {
    // Get IDs of issues that have assignments
    const { data: assignments } = await supabase
      .from("issue_assignments")
      .select("issue_id");

    const assignedIssueIds = assignments?.map((a) => a.issue_id) || [];

    if (assignedFilter === "assigned") {
      if (assignedIssueIds.length > 0) {
        query = query.in("id", assignedIssueIds);
      } else {
        // No assignments exist, so "assigned" filter returns nothing
        query = query.eq("id", -1); // Impossible ID
      }
    } else if (assignedFilter === "unassigned") {
      if (assignedIssueIds.length > 0) {
        query = query.not("id", "in", `(${assignedIssueIds.join(",")})`);
      }
      // If no assignments exist, all issues are unassigned, so no filter needed
    }
  }

  if (fromDate) {
    query = query.gte("created_at", new Date(fromDate).toISOString());
  }

  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("created_at", end.toISOString());
  }

  if (searchQuery) {
    // Search by title or ID
    // If query is a number, try to match ID
    if (!isNaN(Number(searchQuery))) {
      query = query.or(`title.ilike.%${searchQuery}%,id.eq.${searchQuery}`);
    } else {
      query = query.ilike("title", `%${searchQuery}%`);
    }
  }

  // Apply sorting and pagination
  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, count } = await query;
  const issues = (Array.isArray(data) ? data : []) as Omit<DbIssue, "reporter_name">[];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch reporter information for visible issues
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id).filter((id): id is number => id !== null))];
  let reporterMap = new Map<number, string>();

  if (reporterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reporterIds);

    if (profiles) {
      profiles.forEach((profile) => {
        if (profile.id && profile.full_name) {
          reporterMap.set(profile.id, profile.full_name);
        }
      });
    }
  }

  // Add reporter names to issues
  const rows: DbIssue[] = issues.map((issue) => ({
    ...issue,
    reporter_name: issue.reporter_id ? reporterMap.get(issue.reporter_id) || null : null,
  }));

  // Fetch issues with coordinates for map visualization (separate query to show density of ALL issues matching filter)
  // We apply the same filters EXCEPT pagination to the map
  // Note: getIssuesWithCoordinates helper might need update to accept filters, 
  // but for now we'll rely on the default behavior (all issues) or implement a filtered version here if needed.
  // The current UI implies "Density Map" which usually means global density. 
  // Let's keep using the helper for global density for now to avoid complexity or empty maps on specific text searches.
  const issuesWithCoords = await getIssuesWithCoordinates();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {counters.map((k, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-600">{k.label}</p>
            <p className="mt-2 text-5xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white mb-4">
          Issue Density Map
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Visual representation of reported issues showing density hotspots. Areas with more issues appear in warmer colors (red/orange), while areas with fewer issues appear in cooler colors (green/yellow).
        </p>
        <IssueDensityMap issues={issuesWithCoords} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <IssuesFilters />
        <div className="h-px bg-gray-200" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <IssuesTable issues={rows} />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
