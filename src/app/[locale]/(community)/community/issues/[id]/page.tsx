import Link from "next/link";
import Image from "next/image";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getIssueActivity } from "@/lib/actions/issues";
import ActivityLog from "@/components/issues/ActivityLog";
import ImagePreview from "./ImagePreview";

function statusBadge(s: string) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-orange-100 text-orange-600", label: "Pending" },
    in_progress: { cls: "bg-blue-100 text-blue-600", label: "In Progress" },
    resolved: { cls: "bg-green-100 text-green-600", label: "Resolved" },
    closed: { cls: "bg-gray-100 text-gray-600", label: "Closed" },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full h-7 px-3 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

export default async function CommunityIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!idNum || Number.isNaN(idNum)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/community/dashboard" className="text-gray-500 hover:text-primary">Dashboard</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">Issue not found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please check the URL or open an issue from the dashboard list.</p>
        </div>
      </div>
    );
  }
  const supabase = await getSupabaseReadOnlyClient();
  const { data: issue, error: issueErr } = await supabase
    .from("issues")
    .select("id,title,description,status,address,category,created_at,lat,lng,reporter_id")
    .eq("id", idNum)
    .maybeSingle();
  if (issueErr) {
    console.error("issue fetch error", issueErr.message);
  }
  if (!issue) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/community/dashboard" className="text-gray-500 hover:text-primary">Dashboard</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">Issue not found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The requested issue does not exist or you may not have access.</p>
        </div>
      </div>
    );
  }
  const { data: mediaRows, error: mediaErr } = await supabase
    .from("issue_media")
    .select("url,type,size_bytes")
    .eq("issue_id", idNum);
  if (mediaErr) {
    console.error("media fetch error", mediaErr.message);
  }
  const media: Array<{ url: string; type?: string | null; size_bytes?: number | null }> = Array.isArray(mediaRows) ? mediaRows : [];

  // Fetch reporter information
  let reporterInfo: { full_name: string | null; email: string | null; phone: string | null } | null = null;
  if (issue?.reporter_id) {
    const { data: reporter, error: reporterError } = await supabase
      .from("profiles")
      .select("full_name,email,phone")
      .eq("id", issue.reporter_id)
      .maybeSingle();
    
    if (!reporterError && reporter) {
      reporterInfo = {
        full_name: reporter.full_name || null,
        email: reporter.email || null,
        phone: reporter.phone || null,
      };
    }
  }

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
        <Link href="/community/dashboard" className="text-gray-500 hover:text-primary">Dashboard</Link>
        <span className="text-gray-400">/</span>
        <Link href="/community/report" className="text-gray-500 hover:text-primary">Report</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">#{issue.id}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="min-w-72 flex-1">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{issue.title}</p>
            {statusBadge(issue.status)}
          </div>
          <p className="text-gray-600 dark:text-gray-300">{catLabel} • {dateStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-2">Details</h2>
            <p className="text-gray-600 dark:text-gray-300">{issue.description}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-2">Media</h2>
            {media.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No media submitted.</p>
            ) : (
              <div className="space-y-4">
                <ImagePreview media={media} issueTitle={issue.title} />
                {media.some((m) => m.type === "video") && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {media
                      .filter((m) => m.type === "video")
                      .map((m, idx) => (
                        <video key={idx} className="rounded-lg aspect-square object-cover w-full h-auto" src={m.url ?? ""} controls />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-2">Location</h2>
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
            <h2 className="text-lg font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-2">Summary</h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p><span className="font-medium">Status:</span> {issue.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
              <p><span className="font-medium">Category:</span> {catLabel}</p>
              <p><span className="font-medium">Reported:</span> {dateStr}</p>
              {reporterInfo && (
                <>
                  {reporterInfo.full_name && (
                    <p><span className="font-medium">Reporter:</span> {reporterInfo.full_name}</p>
                  )}
                  {reporterInfo.email && (
                    <p><span className="font-medium">Email:</span> <a href={`mailto:${reporterInfo.email}`} className="text-primary hover:underline">{reporterInfo.email}</a></p>
                  )}
                  {reporterInfo.phone && (
                    <p><span className="font-medium">Phone:</span> <a href={`tel:${reporterInfo.phone}`} className="text-primary hover:underline">{reporterInfo.phone}</a></p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">Activity</h2>
            <ActivityLog activities={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
