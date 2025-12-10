import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getIssuesWithCoordinates } from "@/lib/actions/issues";
import IssueDensityMap from "@/components/issues/IssueDensityMap";
import IssueActionsButtonWrapper from "./IssueActionsButtonWrapper";
import IssuesFilters from "./IssuesFilters";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  reporter_id: number | null;
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
  const rows: DbIssue[] = Array.isArray(data) ? data : [];

  // Fetch issues with coordinates for map visualization
  const issuesWithCoords = await getIssuesWithCoordinates();

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    closed: t("status.closed"),
  };

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
        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>{t("table.noIssues") || "No issues found"}</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3"><input type="checkbox" aria-label={t("table.selectAll")} className="size-4" /></th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.issueId")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.title")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.dateSubmitted")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.category")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-200">
                  <td className="px-4 py-3"><input type="checkbox" aria-label={`Select #${r.id}`} className="size-4" /></td>
                  <td className="px-4 py-3 text-primary font-medium"><Link href={`/admin/issues/${r.id}`}>#{r.id}</Link></td>
                  <td className="px-4 py-3"><Link href={`/admin/issues/${r.id}`} className="hover:text-primary">{r.title}</Link></td>
                  <td className="px-4 py-3">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{r.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="pending"?"bg-blue-100 text-blue-800":r.status==="in_progress"?"bg-yellow-100 text-yellow-800":r.status==="resolved"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800"}`}>{statusLabels[r.status] || r.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <IssueActionsButtonWrapper issueId={r.id} reporterId={r.reporter_id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
