import { Suspense } from "react";
import { getCurrentUserAccessReadOnly } from "@/lib/utils/accessControl";
import { getAdunDashboardStats } from "@/lib/actions/reports";
import ReportsTable from "./ReportsTable";
import { getTranslations } from "next-intl/server";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("dashboard");
  const access = await getCurrentUserAccessReadOnly();
  const isAdun = access.isAdun;
  const isSuperAdmin = access.isSuperAdmin;
  const showAdunDashboard = isAdun || isSuperAdmin;

  // Get ADUN dashboard statistics if user is ADUN or super admin
  let adunStats = null;
  if (showAdunDashboard) {
    const statsResult = await getAdunDashboardStats();
    if (statsResult.success && statsResult.data) {
      adunStats = statsResult.data;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{showAdunDashboard ? t("adunDashboard") : t("adminDashboard")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {showAdunDashboard ? t("adunDescription") : t("adminDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold">{t("export")}</button>
        </div>
      </div>

      {showAdunDashboard && adunStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalVillages")}</p>
                <p className="text-3xl font-bold text-primary mt-2">{adunStats.total_villages.toLocaleString()}</p>
              </div>
              <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="size-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalZones")}</p>
                <p className="text-3xl font-bold text-primary mt-2">{adunStats.total_zones.toLocaleString()}</p>
              </div>
              <div className="size-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="size-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalVoters")}</p>
                <p className="text-3xl font-bold text-primary mt-2">{adunStats.total_voters.toLocaleString()}</p>
              </div>
              <div className="size-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="size-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {labelKey:"pending",value:"128"},
            {labelKey:"inReview",value:"42"},
            {labelKey:"resolved",value:"950"},
            {labelKey:"overdue",value:"17"},
          ].map((k, i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t(k.labelKey)}</p>
              <p className="text-3xl font-bold text-primary">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Voter Demographics Section */}
      {showAdunDashboard && adunStats && adunStats.total_voters > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-semibold mb-4">{t("voterAgeDistribution")}</h2>
            {adunStats.age_distribution.length > 0 ? (
              <div className="space-y-4">
                {adunStats.age_distribution.map((ageGroup, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{ageGroup.age_group} {t("years")}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {ageGroup.count.toLocaleString()} ({ageGroup.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all"
                        style={{ width: `${ageGroup.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noAgeDataAvailable")}</p>
            )}
          </div>

          {/* Voters by Locality */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
            <h2 className="text-lg font-semibold mb-4">{t("topVotingLocalities")}</h2>
            {adunStats.voters_by_locality.length > 0 ? (
              <div className="space-y-3">
                {adunStats.voters_by_locality.map((locality, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {locality.locality}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {locality.count.toLocaleString()} {t("voters")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {locality.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noLocalityDataAvailable")}</p>
            )}
          </div>
        </div>
      )}

      {/* Voter Support Status Analysis */}
      {showAdunDashboard && adunStats && adunStats.total_voters > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h2 className="text-lg font-semibold mb-4">{t("voterSupportStatusAnalysis")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800 dark:text-green-300">{t("whiteFullSupport")}</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {adunStats.support_status.white_supporters.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {adunStats.support_status.support_percentage}{t("ofTotalVoters")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800 dark:text-red-300">{t("blackNotSupporting")}</span>
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {adunStats.support_status.black_non_supporters.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                {adunStats.total_voters > 0 
                  ? ((adunStats.support_status.black_non_supporters / adunStats.total_voters) * 100).toFixed(2)
                  : 0}{t("ofTotalVoters")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{t("redUndetermined")}</span>
                <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {adunStats.support_status.red_undetermined.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {adunStats.total_voters > 0 
                  ? ((adunStats.support_status.red_undetermined / adunStats.total_voters) * 100).toFixed(2)
                  : 0}{t("ofTotalVoters")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{t("unclassified")}</span>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                  {adunStats.support_status.unclassified.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {adunStats.total_voters > 0 
                  ? ((adunStats.support_status.unclassified / adunStats.total_voters) * 100).toFixed(2)
                  : 0}{t("ofTotalVoters")}
              </p>
            </div>
          </div>
          
          {/* Support Score */}
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{t("supportScore")}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {t("basedOnClassifiedVoters")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {adunStats.support_status.support_score}%
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {adunStats.support_status.white_supporters + adunStats.support_status.black_non_supporters + adunStats.support_status.red_undetermined} {t("classifiedVoters")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t("loadingReports")}</div>
        </div>
      }>
        <ReportsTableWrapper />
      </Suspense>
    </div>
  );
}

async function ReportsTableWrapper() {
  const supabase = await getSupabaseReadOnlyClient();
  
  // Fetch all issues for admin - no filtering by reporter_id
  // Admin users should see all issues regardless of who reported them
  const { data: issues } = await supabase
    .from("issues")
    .select("id, title, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!issues || issues.length === 0) {
    return <ReportsTable initialReports={[]} />;
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

  return <ReportsTable initialReports={reports} />;
}
