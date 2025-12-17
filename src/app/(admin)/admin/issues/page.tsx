import { Plus, Search } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import IssueFormModal from "./IssueFormModal";
import IssueActionsButton from "@/app/[locale]/(admin)/admin/issues/IssueActionsButton";
import { getIssuesWithCoordinates } from "@/lib/actions/issues";
import IssueDensityMap from "@/components/issues/IssueDensityMap";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  reporter_id: number | null;
};

export default async function AdminIssuesPage() {
  const supabase = await getSupabaseReadOnlyClient();
  
  // Fetch statistics with proper error handling
  // Total Open Issues: status IN ('pending', 'in_progress') - excludes 'resolved' and 'closed'
  const { count: totalOpenCount, error: totalOpenError } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress"]);
  
  if (totalOpenError) {
    console.error("Error fetching total open issues:", totalOpenError);
  }
  
  // Pending Review: status = 'pending'
  const { count: pendingCount, error: pendingError } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  
  if (pendingError) {
    console.error("Error fetching pending issues:", pendingError);
  }
  
  // Resolved This Week: status = 'resolved' AND resolved_at >= start of current week
  // Calculate start of week (Sunday as first day) in UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - dayOfWeek, // Go back to Sunday
    0, 0, 0, 0 // Set to midnight UTC
  ));
  
  const { count: resolvedThisWeekCount, error: resolvedError } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved")
    .gte("resolved_at", startOfWeek.toISOString());
  
  if (resolvedError) {
    console.error("Error fetching resolved this week:", resolvedError);
  }
  
  // Closed Issues: status = 'closed'
  const { count: closedCount, error: closedError } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");
  
  if (closedError) {
    console.error("Error fetching closed issues:", closedError);
  }
  
  const counters = [
    { 
      label: "Total Open Issues", 
      value: String(totalOpenCount ?? 0),
      color: "bg-blue-50 border-blue-200 text-blue-900"
    },
    { 
      label: "Pending Review", 
      value: String(pendingCount ?? 0),
      color: "bg-yellow-50 border-yellow-200 text-yellow-900"
    },
    { 
      label: "Resolved This Week", 
      value: String(resolvedThisWeekCount ?? 0),
      color: "bg-green-50 border-green-200 text-green-900"
    },
    { 
      label: "Closed Issues", 
      value: String(closedCount ?? 0),
      color: "bg-gray-50 border-gray-200 text-gray-900"
    },
  ];

  const { data, error: issuesError } = await supabase
    .from("issues")
    .select("id,title,category,status,created_at,reporter_id")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (issuesError) {
    console.error("Error fetching issues:", issuesError);
  }
  
  const rows: DbIssue[] = Array.isArray(data) ? data : [];

  // Fetch issues with coordinates for map visualization
  const issuesWithCoords = await getIssuesWithCoordinates();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Issues Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {counters.map((k, i) => (
          <div key={i} className={`rounded-xl border p-6 ${k.color}`}>
            <p className="text-sm opacity-80">{k.label}</p>
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
        <div className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
              <Input placeholder="Search by keyword, ID, or reporter..." className="pl-9 w-full" />
            </div>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Status: All</option>
              <option>New</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Type: All</option>
              <option>Infrastructure</option>
              <option>Utilities</option>
              <option>Sanitation</option>
              <option>Public Safety</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Assigned: All</option>
              <option>Unassigned</option>
              <option>Team A</option>
              <option>Sanitation Dept.</option>
            </select>
            <Input asChild className="w-44">
              <input placeholder="Select date range" />
            </Input>
            <button className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white">Reset Filters</button>
            <IssueFormModal
              trigger={
                <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold">
                  <Plus className="size-5" />
                  <span>New Issue</span>
                </button>
              }
            />
          </div>
        </div>
        <div className="h-px bg-gray-200" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" className="size-4" /></th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Issue ID</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Title</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Date Submitted</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-200">
                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select #${r.id}`} className="size-4" /></td>
                <td className="px-4 py-3 text-primary font-medium"><Link href={`/admin/issues/${r.id}`}>#{r.id}</Link></td>
                <td className="px-4 py-3"><Link href={`/admin/issues/${r.id}`} className="hover:text-primary">{r.title}</Link></td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="pending"?"bg-blue-100 text-blue-800":r.status==="in_progress"?"bg-yellow-100 text-yellow-800":r.status==="resolved"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800"}`}>{r.status.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <IssueActionsButton issueId={r.id} reporterId={r.reporter_id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
