"use client";

import { useEffect, useState } from "react";
import { getSprVoterSupportReport, type SprVoterSupportData } from "@/lib/actions/reports";
import { getVoterVersions, type SprVoterVersion } from "@/lib/actions/spr-voters";
import { TrendingUp, Users, Circle, AlertCircle, BarChart3, PieChart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useTranslations } from "next-intl";

type SprVoterReportProps = {
  versions: SprVoterVersion[];
  initialVersionId?: number;
};

export default function SprVoterReport({ versions, initialVersionId }: SprVoterReportProps) {
  const t = useTranslations("sprVoterReports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(initialVersionId);
  const [data, setData] = useState<SprVoterSupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync with URL parameters
  useEffect(() => {
    const versionIdParam = searchParams.get("versionId");
    if (versionIdParam) {
      const versionId = parseInt(versionIdParam, 10);
      if (!isNaN(versionId) && versionId !== selectedVersionId) {
        setSelectedVersionId(versionId);
      }
    } else if (selectedVersionId !== undefined) {
      setSelectedVersionId(undefined);
    }
  }, [searchParams, selectedVersionId]);

  useEffect(() => {
    async function fetchData() {
      if (!selectedVersionId) {
        setLoading(false);
        setData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getSprVoterSupportReport(selectedVersionId);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || t("failedToLoad"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("anErrorOccurred"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedVersionId]);

  const handleVersionChange = (versionId: number | undefined) => {
    setSelectedVersionId(versionId);
    const params = new URLSearchParams(searchParams.toString());
    if (versionId) {
      params.set("versionId", versionId.toString());
    } else {
      params.delete("versionId");
    }
    // Preserve report type if it exists
    if (!params.has("type")) {
      params.set("type", "support");
    }
    router.push(`/admin/spr-voters/report?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">{t("error")}: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t("noData")}</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const classifiedVoters =
    data.total_white_supporters + data.total_black_non_supporters + data.total_red_undetermined;
  const classifiedPercentage =
    data.total_voters > 0 ? ((classifiedVoters / data.total_voters) * 100).toFixed(1) : "0";

  const versionOptions = versions.map((v) => ({
    value: v.id,
    label: v.name,
    description: v.description || undefined,
  }));

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <div className="space-y-6">
      {/* Version Selector */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t("selectVersion")}:
          </label>
          <div className="flex-1 max-w-md">
            <SearchableSelect
              options={versionOptions}
              value={selectedVersionId || ""}
              onChange={(value) => handleVersionChange(typeof value === "number" ? value : parseInt(value as string, 10))}
              placeholder={t("selectVersionPlaceholder")}
              searchPlaceholder={t("searchVersions")}
            />
          </div>
          {selectedVersion && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedVersion.is_active && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full">
                  {t("active")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {!selectedVersionId && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12 text-center">
          <BarChart3 className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t("pleaseSelectVersion")}
          </p>
        </div>
      )}

      {selectedVersionId && loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t("loading")}</div>
        </div>
      )}

      {selectedVersionId && error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">{t("error")}: {error}</div>
        </div>
      )}

      {selectedVersionId && !loading && !error && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t("noDataForVersion")}</div>
        </div>
      )}

      {selectedVersionId && !loading && !error && data && (
        <>
          {/* Total Voters Summary */}
          <div className="rounded-lg border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="size-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalVoters")}</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">
                    {data.total_voters.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("version")}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedVersion?.name || t("unknown")}
                </p>
              </div>
            </div>
          </div>

          {/* Overall Support Score */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="size-8 text-primary" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("overallSupportScore")}
              </h3>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <div className="relative">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.overall_support_score / 100)}`}
                    className={getScoreColor(data.overall_support_score)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(data.overall_support_score)}`}>
                    {data.overall_support_score}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              {t("basedOnVotingSupport")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {t("classifiedPercentage", { percentage: classifiedPercentage })}
            </p>
          </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-white border-2 border-gray-400 rounded-lg">
              <Circle className="size-5 text-gray-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{t("whiteSupporting")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_white_supporters.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_voters > 0
                  ? ((data.total_white_supporters / data.total_voters) * 100).toFixed(1)
                  : "0"}
                {t("ofVoters")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-900 rounded-lg">
              <Circle className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{t("blackNotSupporting")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_black_non_supporters.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_voters > 0
                  ? ((data.total_black_non_supporters / data.total_voters) * 100).toFixed(1)
                  : "0"}
                {t("ofVoters")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-red-600 rounded-lg">
              <AlertCircle className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{t("redUndetermined")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_red_undetermined.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_voters > 0
                  ? ((data.total_red_undetermined / data.total_voters) * 100).toFixed(1)
                  : "0"}
                {t("ofVoters")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
              <Users className="size-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{t("unclassified")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_unclassified.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_voters > 0
                  ? ((data.total_unclassified / data.total_voters) * 100).toFixed(1)
                  : "0"}
                {t("ofVoters")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart: Overall Support Distribution */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="size-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("overallSupportDistribution")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Pie Chart Visualization */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="40"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                {data.total_voters > 0 && (
                  <>
                    {/* White (Supporting) */}
                    {data.total_white_supporters > 0 && (
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        stroke="currentColor"
                        strokeWidth="40"
                        fill="none"
                        className="text-white"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 100 * (1 - data.total_white_supporters / data.total_voters)
                        }`}
                        style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))" }}
                      />
                    )}
                    {/* Black (Not Supporting) */}
                    {data.total_black_non_supporters > 0 && (
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        stroke="currentColor"
                        strokeWidth="40"
                        fill="none"
                        className="text-gray-900"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          100 *
                          (1 -
                            (data.total_white_supporters + data.total_black_non_supporters) /
                              data.total_voters)
                        }`}
                      />
                    )}
                    {/* Red (Undetermined) */}
                    {data.total_red_undetermined > 0 && (
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        stroke="currentColor"
                        strokeWidth="40"
                        fill="none"
                        className="text-red-600"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          100 *
                          (1 -
                            (data.total_white_supporters +
                              data.total_black_non_supporters +
                              data.total_red_undetermined) /
                              data.total_voters)
                        }`}
                      />
                    )}
                    {/* Unclassified */}
                    {data.total_unclassified > 0 && (
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        stroke="currentColor"
                        strokeWidth="40"
                        fill="none"
                        className="text-gray-300 dark:text-gray-600"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          100 *
                          (1 -
                            (data.total_white_supporters +
                              data.total_black_non_supporters +
                              data.total_red_undetermined +
                              data.total_unclassified) /
                              data.total_voters)
                        }`}
                      />
                    )}
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.total_voters.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t("totalVoters")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white border-2 border-gray-400 rounded-full"></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{t("whiteSupporting")}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {data.total_white_supporters.toLocaleString()} (
                  {data.total_voters > 0
                    ? ((data.total_white_supporters / data.total_voters) * 100).toFixed(1)
                    : "0"}
                  %)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-900 rounded-full"></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{t("blackNotSupporting")}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {data.total_black_non_supporters.toLocaleString()} (
                  {data.total_voters > 0
                    ? ((data.total_black_non_supporters / data.total_voters) * 100).toFixed(1)
                    : "0"}
                  %)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-600 rounded-full"></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{t("redUndetermined")}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {data.total_red_undetermined.toLocaleString()} (
                  {data.total_voters > 0
                    ? ((data.total_red_undetermined / data.total_voters) * 100).toFixed(1)
                    : "0"}
                  %)
                </div>
              </div>
            </div>
            {data.total_unclassified > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{t("unclassified")}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {data.total_unclassified.toLocaleString()} (
                    {data.total_voters > 0
                      ? ((data.total_unclassified / data.total_voters) * 100).toFixed(1)
                      : "0"}
                    %)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Bar Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Support Score by Locality */}
        {data.by_locality.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("supportScoreByLocality")}
              </h3>
            </div>
            <div className="space-y-4">
              {data.by_locality
                .sort((a, b) => b.support_score - a.support_score)
                .slice(0, 20)
                .map((locality) => (
                  <div key={locality.locality}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {locality.locality}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {locality.total_voters} {t("voters")}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(locality.support_score)}`}>
                          {locality.support_score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${getScoreBgColor(locality.support_score)} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(locality.support_score, 100)}%` }}
                      >
                        {locality.support_score >= 10 && (
                          <span className="text-xs font-semibold text-white">
                            {locality.support_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stacked breakdown */}
                    <div className="mt-2 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex text-[10px]">
                      {locality.white_supporters > 0 && (
                        <div
                          className="bg-white border-r border-gray-300 flex items-center justify-center font-semibold text-gray-900"
                          style={{
                            width: `${
                              (locality.white_supporters / locality.total_voters) * 100
                            }%`,
                          }}
                          title={`White: ${locality.white_supporters}`}
                        >
                          {locality.white_supporters > 0 &&
                          (locality.white_supporters / locality.total_voters) * 100 > 8
                            ? locality.white_supporters
                            : ""}
                        </div>
                      )}
                      {locality.black_non_supporters > 0 && (
                        <div
                          className="bg-gray-900 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (locality.black_non_supporters / locality.total_voters) * 100
                            }%`,
                          }}
                          title={`Black: ${locality.black_non_supporters}`}
                        >
                          {locality.black_non_supporters > 0 &&
                          (locality.black_non_supporters / locality.total_voters) * 100 > 8
                            ? locality.black_non_supporters
                            : ""}
                        </div>
                      )}
                      {locality.red_undetermined > 0 && (
                        <div
                          className="bg-red-600 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (locality.red_undetermined / locality.total_voters) * 100
                            }%`,
                          }}
                          title={`Red: ${locality.red_undetermined}`}
                        >
                          {locality.red_undetermined > 0 &&
                          (locality.red_undetermined / locality.total_voters) * 100 > 8
                            ? locality.red_undetermined
                            : ""}
                        </div>
                      )}
                      {locality.unclassified > 0 && (
                        <div
                          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (locality.unclassified / locality.total_voters) * 100
                            }%`,
                          }}
                          title={`Unclassified: ${locality.unclassified}`}
                        >
                          {locality.unclassified > 0 &&
                          (locality.unclassified / locality.total_voters) * 100 > 8
                            ? locality.unclassified
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bar Chart: Support Score by Parliament */}
        {data.by_parliament && data.by_parliament.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("supportScoreByParliament")}
              </h3>
            </div>
            <div className="space-y-4">
              {data.by_parliament
                .sort((a, b) => b.support_score - a.support_score)
                .slice(0, 20)
                .map((parliament) => (
                  <div key={parliament.parliament}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {parliament.parliament}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {parliament.total_voters} voters
                        </span>
                        <span
                          className={`text-sm font-bold ${getScoreColor(parliament.support_score)}`}
                        >
                          {parliament.support_score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${getScoreBgColor(parliament.support_score)} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(parliament.support_score, 100)}%` }}
                      >
                        {parliament.support_score >= 10 && (
                          <span className="text-xs font-semibold text-white">
                            {parliament.support_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stacked breakdown */}
                    <div className="mt-2 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex text-[10px]">
                      {parliament.white_supporters > 0 && (
                        <div
                          className="bg-white border-r border-gray-300 flex items-center justify-center font-semibold text-gray-900"
                          style={{
                            width: `${
                              (parliament.white_supporters / parliament.total_voters) * 100
                            }%`,
                          }}
                          title={`White: ${parliament.white_supporters}`}
                        >
                          {parliament.white_supporters > 0 &&
                          (parliament.white_supporters / parliament.total_voters) * 100 > 8
                            ? parliament.white_supporters
                            : ""}
                        </div>
                      )}
                      {parliament.black_non_supporters > 0 && (
                        <div
                          className="bg-gray-900 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (parliament.black_non_supporters / parliament.total_voters) * 100
                            }%`,
                          }}
                          title={`Black: ${parliament.black_non_supporters}`}
                        >
                          {parliament.black_non_supporters > 0 &&
                          (parliament.black_non_supporters / parliament.total_voters) * 100 > 8
                            ? parliament.black_non_supporters
                            : ""}
                        </div>
                      )}
                      {parliament.red_undetermined > 0 && (
                        <div
                          className="bg-red-600 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (parliament.red_undetermined / parliament.total_voters) * 100
                            }%`,
                          }}
                          title={`Red: ${parliament.red_undetermined}`}
                        >
                          {parliament.red_undetermined > 0 &&
                          (parliament.red_undetermined / parliament.total_voters) * 100 > 8
                            ? parliament.red_undetermined
                            : ""}
                        </div>
                      )}
                      {parliament.unclassified > 0 && (
                        <div
                          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center font-semibold"
                          style={{
                            width: `${
                              (parliament.unclassified / parliament.total_voters) * 100
                            }%`,
                          }}
                          title={`Unclassified: ${parliament.unclassified}`}
                        >
                          {parliament.unclassified > 0 &&
                          (parliament.unclassified / parliament.total_voters) * 100 > 8
                            ? parliament.unclassified
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bar Chart: Support Score by Polling Station */}
        {data.by_polling_station.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("supportScoreByPollingStation")}
              </h3>
            </div>
            <div className="space-y-4">
              {data.by_polling_station
                .sort((a, b) => b.support_score - a.support_score)
                .slice(0, 20)
                .map((station) => (
                  <div key={station.polling_station}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {station.polling_station}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {station.total_voters} voters
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(station.support_score)}`}>
                          {station.support_score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${getScoreBgColor(station.support_score)} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(station.support_score, 100)}%` }}
                      >
                        {station.support_score >= 10 && (
                          <span className="text-xs font-semibold text-white">
                            {station.support_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stacked breakdown */}
                    <div className="mt-2 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex text-[10px]">
                      {station.white_supporters > 0 && (
                        <div
                          className="bg-white border-r border-gray-300 flex items-center justify-center font-semibold text-gray-900"
                          style={{
                            width: `${(station.white_supporters / station.total_voters) * 100}%`,
                          }}
                          title={`White: ${station.white_supporters}`}
                        >
                          {station.white_supporters > 0 &&
                          (station.white_supporters / station.total_voters) * 100 > 8
                            ? station.white_supporters
                            : ""}
                        </div>
                      )}
                      {station.black_non_supporters > 0 && (
                        <div
                          className="bg-gray-900 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${(station.black_non_supporters / station.total_voters) * 100}%`,
                          }}
                          title={`Black: ${station.black_non_supporters}`}
                        >
                          {station.black_non_supporters > 0 &&
                          (station.black_non_supporters / station.total_voters) * 100 > 8
                            ? station.black_non_supporters
                            : ""}
                        </div>
                      )}
                      {station.red_undetermined > 0 && (
                        <div
                          className="bg-red-600 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${(station.red_undetermined / station.total_voters) * 100}%`,
                          }}
                          title={`Red: ${station.red_undetermined}`}
                        >
                          {station.red_undetermined > 0 &&
                          (station.red_undetermined / station.total_voters) * 100 > 8
                            ? station.red_undetermined
                            : ""}
                        </div>
                      )}
                      {station.unclassified > 0 && (
                        <div
                          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center font-semibold"
                          style={{
                            width: `${(station.unclassified / station.total_voters) * 100}%`,
                          }}
                          title={`Unclassified: ${station.unclassified}`}
                        >
                          {station.unclassified > 0 &&
                          (station.unclassified / station.total_voters) * 100 > 8
                            ? station.unclassified
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bar Chart: Support Score by Channel */}
        {data.by_channel && data.by_channel.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("supportScoreByChannel")}
              </h3>
            </div>
            <div className="space-y-4">
              {data.by_channel
                .sort((a, b) => {
                  if (a.channel === null && b.channel === null) return 0;
                  if (a.channel === null) return 1;
                  if (b.channel === null) return -1;
                  return b.support_score - a.support_score;
                })
                .slice(0, 20)
                .map((channel) => (
                  <div key={channel.channel ?? "null"}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {t("channel")} {channel.channel ?? t("notSpecified")}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {channel.total_voters} voters
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(channel.support_score)}`}>
                          {channel.support_score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${getScoreBgColor(channel.support_score)} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(channel.support_score, 100)}%` }}
                      >
                        {channel.support_score >= 10 && (
                          <span className="text-xs font-semibold text-white">
                            {channel.support_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stacked breakdown */}
                    <div className="mt-2 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex text-[10px]">
                      {channel.white_supporters > 0 && (
                        <div
                          className="bg-white border-r border-gray-300 flex items-center justify-center font-semibold text-gray-900"
                          style={{
                            width: `${(channel.white_supporters / channel.total_voters) * 100}%`,
                          }}
                          title={`White: ${channel.white_supporters}`}
                        >
                          {channel.white_supporters > 0 &&
                          (channel.white_supporters / channel.total_voters) * 100 > 8
                            ? channel.white_supporters
                            : ""}
                        </div>
                      )}
                      {channel.black_non_supporters > 0 && (
                        <div
                          className="bg-gray-900 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${(channel.black_non_supporters / channel.total_voters) * 100}%`,
                          }}
                          title={`Black: ${channel.black_non_supporters}`}
                        >
                          {channel.black_non_supporters > 0 &&
                          (channel.black_non_supporters / channel.total_voters) * 100 > 8
                            ? channel.black_non_supporters
                            : ""}
                        </div>
                      )}
                      {channel.red_undetermined > 0 && (
                        <div
                          className="bg-red-600 text-white flex items-center justify-center font-semibold"
                          style={{
                            width: `${(channel.red_undetermined / channel.total_voters) * 100}%`,
                          }}
                          title={`Red: ${channel.red_undetermined}`}
                        >
                          {channel.red_undetermined > 0 &&
                          (channel.red_undetermined / channel.total_voters) * 100 > 8
                            ? channel.red_undetermined
                            : ""}
                        </div>
                      )}
                      {channel.unclassified > 0 && (
                        <div
                          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center font-semibold"
                          style={{
                            width: `${(channel.unclassified / channel.total_voters) * 100}%`,
                          }}
                          title={`Unclassified: ${channel.unclassified}`}
                        >
                          {channel.unclassified > 0 &&
                          (channel.unclassified / channel.total_voters) * 100 > 8
                            ? channel.unclassified
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
