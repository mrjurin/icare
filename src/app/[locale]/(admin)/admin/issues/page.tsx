import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getIssuesWithCoordinates } from "@/lib/actions/issues";
import IssueDensityMap from "@/components/issues/IssueDensityMap";
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
  const statusFilter = typeof params.status === "string" ? params.status : undefined;

  const supabase = await getSupabaseServerClient();

  // Fetch statistics
  // Total Open Issues: status IN ('pending', 'in_progress', 'resolved')
  const { count: totalOpenCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress", "resolved"]);

  // Pending Review: status = 'pending'
  const { count: pendingCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Resolved This Week: status = 'resolved' AND resolved_at >= start of current week
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

  // Build query with optional status filter
  let query = supabase
    .from("issues")
    .select("id,title,category,status,created_at,reporter_id")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query.limit(50);
  const issues = (Array.isArray(data) ? data : []) as Omit<DbIssue, "reporter_name">[];

  // Fetch reporter information for all issues
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

  // Fetch issues with coordinates for map visualization
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
      </div>
    </div>
  );
}
