import Link from "next/link";
import Image from "next/image";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getIssueActivity } from "@/lib/actions/issues";
import IssueActions from "./IssueActions";
import ActivityLog from "@/components/issues/ActivityLog";
import { getUserWorkspaceType } from "@/lib/utils/access-control";

type Media = { url: string; type?: string | null; size_bytes?: number | null };

function statusBadge(s: string) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400", label: "Pending" },
    in_progress: { cls: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400", label: "In Progress" },
    resolved: { cls: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400", label: "Resolved" },
    closed: { cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300", label: "Closed" },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

export default async function AdminIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  
  // Get user workspace type to determine correct breadcrumb links
  const workspaceType = await getUserWorkspaceType();
  const getBreadcrumbLinks = () => {
    if (workspaceType === "staff") {
      return {
        dashboard: "/staff/dashboard",
        issues: "/staff/issues",
      };
    } else if (workspaceType === "community") {
      return {
        dashboard: "/community/dashboard",
        issues: "/community/report",
      };
    }
    // Default to admin
    return {
      dashboard: "/admin/dashboard",
      issues: "/admin/issues",
    };
  };
  const links = getBreadcrumbLinks();
  
  if (!idNum || Number.isNaN(idNum)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={links.dashboard} className="text-gray-500 hover:text-primary">Dashboard</Link>
          <span className="text-gray-400">/</span>
          <Link href={links.issues} className="text-gray-500 hover:text-primary">All Issues</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">Issue not found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please check the URL or open an issue from the dashboard list.</p>
        </div>
      </div>
    );
  }
  const supabase = await getSupabaseServerClient();
  const { data: issue, error } = await supabase
    .from("issues")
    .select("id,title,description,status,address,category,created_at,lat,lng")
    .eq("id", idNum)
    .single();
  if (error || !issue) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={links.dashboard} className="text-gray-500 hover:text-primary">Dashboard</Link>
          <span className="text-gray-400">/</span>
          <Link href={links.issues} className="text-gray-500 hover:text-primary">All Issues</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">Issue not found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The requested issue does not exist or you may not have access.</p>
        </div>
      </div>
    );
  }

  const { data: mediaRows } = await supabase
    .from("issue_media")
    .select("url,type,size_bytes")
    .eq("issue_id", idNum);
  const media: Media[] = Array.isArray(mediaRows) ? mediaRows : [];

  const { data: assigneesData } = await supabase
    .from("staff")
    .select("id,name")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  const assignees: Array<{ id: number; name?: string | null }> = Array.isArray(assigneesData)
    ? (assigneesData as Array<{ id: number; name?: string | null }>).map((s) => ({ id: s.id, name: s.name ?? null }))
    : [];

  // Get activity log using shared function
  const activity = await getIssueActivity(idNum);

  const catLabel = issue.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const dateStr = new Date(issue.created_at).toLocaleDateString();
  const hasCoords = typeof issue.lat === "number" && typeof issue.lng === "number";
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(Number(issue.lng) - 0.005).toFixed(5)},${(Number(issue.lat) - 0.005).toFixed(5)},${(Number(issue.lng) + 0.005).toFixed(5)},${(Number(issue.lat) + 0.005).toFixed(5)}&layer=mapnik&marker=${Number(issue.lat).toFixed(5)},${Number(issue.lng).toFixed(5)}`
    : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={links.dashboard} className="text-gray-500 hover:text-primary">Dashboard</Link>
        <span className="text-gray-400">/</span>
        <Link href={links.issues} className="text-gray-500 hover:text-primary">All Issues</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">#{issue.id}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="min-w-72 flex-1">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{issue.title}</p>
            {statusBadge(issue.status)}
          </div>
          <p className="text-gray-600 dark:text-gray-300">Issue #{issue.id} • {catLabel} • {dateStr}</p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Issue Details</h2>
            <p className="text-gray-600 dark:text-gray-300">{issue.description}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Submitted Media</h2>
            {media.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No media submitted for this issue.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {media.map((m, idx) => (
                  m.type === "video" ? (
                    <video key={idx} className="rounded-lg aspect-square object-cover w-full h-auto" src={m.url ?? ""} controls />
                  ) : (
                    <Image key={idx} className="rounded-lg aspect-square object-cover" alt={issue.title} src={m.url ?? ""} width={300} height={300} />
                  )
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Location</h2>
            <div className="flex flex-col gap-4">
              {hasCoords ? (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <iframe src={mapSrc} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Issue Location" />
                </div>
              ) : (
                <div className="h-32 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-sm text-gray-500">No coordinates available</div>
              )}
              <p className="text-gray-600 dark:text-gray-300">{issue.address}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Actions</h2>
            <IssueActions
              issueId={idNum}
              initialStatus={issue.status}
              assignees={assignees}
            />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Activity Log</h2>
            <ActivityLog activities={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
