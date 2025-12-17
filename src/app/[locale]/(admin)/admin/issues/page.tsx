import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getIssuesWithCoordinates } from "@/lib/actions/issues";
import { getReferenceDataList } from "@/lib/actions/reference-data";
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
  issue_types?: { name: string } | null;
  issue_type_name?: string | null;
  issue_statuses?: { id: number; name: string; code: string | null } | null;
  issue_status_id?: number | null;
  issue_status_name?: string | null;
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

  // Fetch issue statuses and types first (needed for counters and filters)
  const { data: issueTypesResult } = await getReferenceDataList("issue_types");
  const issueTypes = issueTypesResult || [];

  const { data: issueStatusesResult } = await getReferenceDataList("issue_statuses");
  const issueStatuses = issueStatusesResult || [];

  // Fetch counters using issue_statuses table
  // Get status IDs for "open" statuses (pending, in_progress, resolved)
  // We'll look for statuses by name or code that match these patterns
  const openStatusNames = ["pending", "in_progress", "resolved"];
  const openStatusIds = issueStatuses
    .filter((s) => {
      const nameLower = s.name.toLowerCase();
      const codeLower = s.code?.toLowerCase() || "";
      return openStatusNames.some((os) => nameLower.includes(os) || codeLower.includes(os));
    })
    .map((s) => s.id);

  const pendingStatusIds = issueStatuses
    .filter((s) => {
      const nameLower = s.name.toLowerCase();
      const codeLower = s.code?.toLowerCase() || "";
      return nameLower.includes("pending") || codeLower.includes("pending");
    })
    .map((s) => s.id);

  const resolvedStatusIds = issueStatuses
    .filter((s) => {
      const nameLower = s.name.toLowerCase();
      const codeLower = s.code?.toLowerCase() || "";
      return nameLower.includes("resolved") || codeLower.includes("resolved");
    })
    .map((s) => s.id);

  const { count: totalOpenCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("issue_status_id", openStatusIds.length > 0 ? openStatusIds : [-1]);

  const { count: pendingCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("issue_status_id", pendingStatusIds.length > 0 ? pendingStatusIds : [-1]);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const { count: resolvedThisWeekCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("issue_status_id", resolvedStatusIds.length > 0 ? resolvedStatusIds : [-1])
    .gte("resolved_at", startOfWeek.toISOString());

  const counters = [
    { label: t("counters.totalOpenIssues"), value: String(totalOpenCount || 0) },
    { label: t("counters.pendingReview"), value: String(pendingCount || 0) },
    { label: t("counters.resolvedThisWeek"), value: String(resolvedThisWeekCount || 0) },
  ];

  // Build main query with join to issue_statuses
  let query = supabase
    .from("issues")
    .select("id,title,category,status,created_at,reporter_id,issue_status_id,issue_types(name),issue_statuses(id,name,code)", { count: "exact" });

  // Apply filters
  if (statusFilter) {
    // If statusFilter is a number, it's an issue_status_id
    if (!isNaN(Number(statusFilter))) {
      query = query.eq("issue_status_id", parseInt(statusFilter));
    } else {
      // Fallback to enum status for backward compatibility
      query = query.eq("status", statusFilter);
    }
  }

  if (categoryFilter) {
    if (!isNaN(Number(categoryFilter))) {
      query = query.eq("issue_type_id", parseInt(categoryFilter));
    } else {
      query = query.eq("category", categoryFilter);
    }
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

  const { data, count, error: queryError } = await query;
  
  if (queryError) {
    console.error("Error fetching issues:", queryError);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issues = (Array.isArray(data) ? data : []) as any[];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Create a map of status ID to status name for manual lookup
  const statusIdToNameMap = new Map<number, string>();
  issueStatuses.forEach((status) => {
    statusIdToNameMap.set(status.id, status.name);
  });

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

  // Create a map of status enum values to status names for fallback lookup
  // This handles cases where issue_status_id might be null but we have the enum status
  const statusEnumToNameMap = new Map<string, string>();
  issueStatuses.forEach((status) => {
    // Match by code if it matches enum values (e.g., "pending", "in_progress")
    if (status.code) {
      statusEnumToNameMap.set(status.code.toLowerCase(), status.name);
    }
    // Also match by name if it contains enum values
    const nameLower = status.name.toLowerCase();
    if (nameLower.includes("pending")) statusEnumToNameMap.set("pending", status.name);
    if (nameLower.includes("in_progress") || nameLower.includes("in progress")) statusEnumToNameMap.set("in_progress", status.name);
    if (nameLower.includes("resolved")) statusEnumToNameMap.set("resolved", status.name);
    if (nameLower.includes("closed")) statusEnumToNameMap.set("closed", status.name);
  });

  // Add reporter names and flatten issue type and status
  // Note: We use the 'name' field from issue_statuses for display, not the 'code' field
  const rows: DbIssue[] = issues.map((issue) => {
    // Try to get status name from joined data first
    let statusName = issue.issue_statuses?.name;
    
    // If join didn't work, try manual lookup by issue_status_id
    if (!statusName && issue.issue_status_id) {
      statusName = statusIdToNameMap.get(issue.issue_status_id) || null;
    }
    
    // If still not available, try to look it up from the enum status value
    if (!statusName && issue.status) {
      statusName = statusEnumToNameMap.get(issue.status.toLowerCase()) || null;
    }
    
    return {
      ...issue,
      reporter_name: issue.reporter_id ? reporterMap.get(issue.reporter_id) || null : null,
      issue_type_name: issue.issue_types?.name || null,
      issue_status_name: statusName, // Using 'name' field, not 'code'
    };
  });

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
        <IssuesFilters issueTypes={issueTypes} issueStatuses={issueStatuses} />
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
