import Link from "next/link";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getIssueActivity } from "@/lib/actions/issues";
import IssueActions from "./IssueActions";
import ActivityLog from "@/components/issues/ActivityLog";
import ImagePreview from "./ImagePreview";
import { getTranslations } from "next-intl/server";

type Media = { url: string; type?: string | null; size_bytes?: number | null };

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    pending: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
    in_progress: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    resolved: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
    closed: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
  };
  const cls = map[status] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

export default async function AdminIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  const t = await getTranslations("issues.detail");

  if (!idNum || Number.isNaN(idNum)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-primary">{t("dashboard")}</Link>
          <span className="text-gray-400">/</span>
          <Link href="/admin/issues" className="text-gray-500 hover:text-primary">{t("allIssues")}</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">{t("issueNotFound")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("checkUrlOrOpenFromList")}</p>
        </div>
      </div>
    );
  }
  const supabase = await getSupabaseReadOnlyClient();
  const { data: issue, error } = await supabase
    .from("issues")
    .select("id,title,description,status,address,category,created_at,lat,lng,reporter_id")
    .eq("id", idNum)
    .single();

  if (error || !issue) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-primary">{t("dashboard")}</Link>
          <span className="text-gray-400">/</span>
          <Link href="/admin/issues" className="text-gray-500 hover:text-primary">{t("allIssues")}</Link>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-base text-gray-700 dark:text-gray-300">{t("issueNotFound")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("issueNotExistOrNoAccess")}</p>
        </div>
      </div>
    );
  }

  const { data: mediaRows } = await supabase
    .from("issue_media")
    .select("url,type,size_bytes")
    .eq("issue_id", idNum);
  const media: Media[] = Array.isArray(mediaRows) ? mediaRows : [];

  // Fetch issuer/reporter information
  let issuer: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    icNumber: string | null;
  } | null = null;

  if (issue.reporter_id) {
    const { data: reporterData } = await supabase
      .from("profiles")
      .select("full_name,email,phone,address,ic_number")
      .eq("id", issue.reporter_id)
      .single();

    if (reporterData) {
      issuer = {
        fullName: reporterData.full_name ?? null,
        email: reporterData.email ?? null,
        phone: reporterData.phone ?? null,
        address: reporterData.address ?? null,
        icNumber: reporterData.ic_number ?? null,
      };
    }
  }

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

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    closed: t("status.closed"),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">{t("dashboard")}</Link>
        <span className="text-gray-400">/</span>
        <Link href="/admin/issues" className="text-gray-500 hover:text-primary">{t("allIssues")}</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">#{issue.id}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="min-w-72 flex-1">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{issue.title}</p>
            <StatusBadge status={issue.status} label={statusLabels[issue.status] || statusLabels.pending} />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{t("issueLabel")} #{issue.id} • {catLabel} • {dateStr}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("issueDetails")}</h2>
            <p className="text-gray-600 dark:text-gray-300">{issue.description}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("submittedMedia")}</h2>
            {media.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("noMediaSubmitted")}</p>
            ) : (
              <div className="space-y-4">
                {/* Videos */}
                {media.filter((m) => m.type === "video").length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("videos")}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {media
                        .filter((m) => m.type === "video")
                        .map((m, idx) => (
                          <video key={idx} className="rounded-lg aspect-square object-cover w-full h-auto" src={m.url ?? ""} controls />
                        ))}
                    </div>
                  </div>
                )}

                {/* Images with preview */}
                {media.filter((m) => m.type !== "video").length > 0 && (
                  <div>
                    {media.filter((m) => m.type === "video").length > 0 && (
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("images")}</h3>
                    )}
                    <ImagePreview media={media} issueTitle={issue.title} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("location")}</h2>
            <div className="flex flex-col gap-4">
              {hasCoords ? (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <iframe src={mapSrc} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={t("issueLocationTitle")} />
                </div>
              ) : (
                <div className="h-32 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-sm text-gray-500">{t("noCoordinatesAvailable")}</div>
              )}
              <p className="text-gray-600 dark:text-gray-300">{issue.address}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("issuerInformation")}</h2>
            {issuer ? (
              <div className="space-y-3">
                {issuer.fullName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("name")}</p>
                    <p className="text-base text-gray-900 dark:text-white">{issuer.fullName}</p>
                  </div>
                )}
                {issuer.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("email")}</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      <a href={`mailto:${issuer.email}`} className="text-primary hover:underline">
                        {issuer.email}
                      </a>
                    </p>
                  </div>
                )}
                {issuer.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("phone")}</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      <a href={`tel:${issuer.phone}`} className="text-primary hover:underline">
                        {issuer.phone}
                      </a>
                    </p>
                  </div>
                )}
                {issuer.icNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("icNumber")}</p>
                    <p className="text-base text-gray-900 dark:text-white">{issuer.icNumber}</p>
                  </div>
                )}
                {issuer.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("address")}</p>
                    <p className="text-base text-gray-900 dark:text-white">{issuer.address}</p>
                  </div>
                )}
                {!issuer.fullName && !issuer.email && !issuer.phone && !issuer.icNumber && !issuer.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t("noIssuerInformation")}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("noIssuerInformation")}</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("actions")}</h2>
            <IssueActions
              issueId={idNum}
              initialStatus={issue.status}
              assignees={assignees}
            />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-xl font-bold tracking-[-0.015em] text-gray-900 dark:text-white pb-4">{t("activityLog")}</h2>
            <ActivityLog activities={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
