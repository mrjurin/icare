"use client";

import { useEffect, useState } from "react";
import { getSprVoterDemographicReport, type SprVoterDemographicData } from "@/lib/actions/reports";
import { getVoterVersions, type SprVoterVersion } from "@/lib/actions/spr-voters";
import { Users, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useTranslations } from "next-intl";

type SprVoterDemographicReportProps = {
  versions: SprVoterVersion[];
  initialVersionId?: number;
};

export default function SprVoterDemographicReport({
  versions,
  initialVersionId,
}: SprVoterDemographicReportProps) {
  const t = useTranslations("sprVoterReports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(initialVersionId);
  const [data, setData] = useState<SprVoterDemographicData | null>(null);
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
        const result = await getSprVoterDemographicReport(selectedVersionId);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || t("failedToLoadDemographic"));
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
      params.set("type", "demographic");
    }
    router.push(`/admin/spr-voters/report?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t("loadingDemographic")}</div>
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
              onChange={(value) =>
                handleVersionChange(typeof value === "number" ? value : parseInt(value as string, 10))
              }
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
            {t("pleaseSelectVersionDemographic")}
          </p>
        </div>
      )}

      {selectedVersionId && !loading && !error && data && (
        <>
          {/* Total Voters */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="size-8 text-primary" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t("totalVoters")}</h3>
            </div>
            <div className="text-5xl font-bold text-gray-900 dark:text-white">
              {data.total_voters.toLocaleString()}
            </div>
          </div>

          {/* Key Demographics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            {data.age_distribution.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("ageDistribution")}</h3>
                </div>
                <div className="space-y-4">
                  {data.age_distribution.map((age) => (
                    <div key={age.age_group}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {age.age_group}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {age.count.toLocaleString()} {t("voters")}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {age.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-primary flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(age.percentage, 100)}%` }}
                        >
                          {age.percentage >= 5 && (
                            <span className="text-xs font-semibold text-white">{age.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gender Distribution */}
            {data.gender_distribution.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("genderDistribution")}</h3>
                </div>
                <div className="space-y-4">
                  {data.gender_distribution.map((gender) => (
                    <div key={gender.gender}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {gender.gender}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {gender.count.toLocaleString()} voters
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {gender.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-blue-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(gender.percentage, 100)}%` }}
                        >
                          {gender.percentage >= 5 && (
                            <span className="text-xs font-semibold text-white">{gender.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Race Distribution */}
            {data.race_distribution.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("raceDistribution")}</h3>
                </div>
                <div className="space-y-4">
                  {data.race_distribution.slice(0, 10).map((race) => (
                    <div key={race.race}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                          {race.race}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {race.count.toLocaleString()} voters
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {race.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-green-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(race.percentage, 100)}%` }}
                        >
                          {race.percentage >= 5 && (
                            <span className="text-xs font-semibold text-white">{race.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Religion Distribution */}
            {data.religion_distribution.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("religionDistribution")}</h3>
                </div>
                <div className="space-y-4">
                  {data.religion_distribution.slice(0, 10).map((religion) => (
                    <div key={religion.religion}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                          {religion.religion}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {religion.count.toLocaleString()} voters
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {religion.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-purple-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(religion.percentage, 100)}%` }}
                        >
                          {religion.percentage >= 5 && (
                            <span className="text-xs font-semibold text-white">{religion.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ethnic Category Distribution */}
            {data.ethnic_category_distribution.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="size-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("ethnicCategoryDistribution")}
                  </h3>
                </div>
                <div className="space-y-4">
                  {data.ethnic_category_distribution.slice(0, 10).map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                          {category.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {category.count.toLocaleString()} voters
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-orange-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        >
                          {category.percentage >= 5 && (
                            <span className="text-xs font-semibold text-white">{category.percentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* By Locality */}
          {data.by_locality.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="size-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("demographicsByLocality")}
                </h3>
              </div>
              <div className="space-y-6">
                {data.by_locality.slice(0, 10).map((locality) => (
                  <div key={locality.locality} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      {locality.locality} ({locality.total_voters.toLocaleString()} {t("voters")})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Age Distribution Pie Chart */}
                      {locality.age_distribution.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                            {t("ageDistribution")}
                          </h5>
                          <div className="flex flex-col items-center gap-4">
                            {/* Pie Chart */}
                            <div className="relative w-48 h-48">
                              <svg className="transform -rotate-90 w-48 h-48">
                                <circle
                                  cx="96"
                                  cy="96"
                                  r="80"
                                  stroke="currentColor"
                                  strokeWidth="32"
                                  fill="none"
                                  className="text-gray-200 dark:text-gray-700"
                                />
                                {locality.age_distribution.map((age, index, array) => {
                                  const colors = [
                                    "text-blue-500",
                                    "text-green-500",
                                    "text-yellow-500",
                                    "text-orange-500",
                                    "text-red-500",
                                    "text-purple-500",
                                    "text-pink-500",
                                    "text-indigo-500",
                                  ];
                                  const color = colors[index % colors.length];
                                  const previousSum = array
                                    .slice(0, index)
                                    .reduce((sum, item) => sum + item.percentage, 0);
                                  const percentage = age.percentage;
                                  const circumference = 2 * Math.PI * 80;
                                  const offset = circumference * (previousSum / 100);
                                  const dashLength = (circumference * percentage) / 100;

                                  return (
                                    <circle
                                      key={age.age_group}
                                      cx="96"
                                      cy="96"
                                      r="80"
                                      stroke="currentColor"
                                      strokeWidth="32"
                                      fill="none"
                                      className={color}
                                      strokeDasharray={`${dashLength} ${circumference}`}
                                      strokeDashoffset={-offset}
                                    />
                                  );
                                })}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {locality.total_voters.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{t("total")}</div>
                                </div>
                              </div>
                            </div>
                            {/* Legend */}
                            <div className="w-full space-y-2">
                              {locality.age_distribution.map((age, index) => {
                                const colors = [
                                  "bg-blue-500",
                                  "bg-green-500",
                                  "bg-yellow-500",
                                  "bg-orange-500",
                                  "bg-red-500",
                                  "bg-purple-500",
                                  "bg-pink-500",
                                  "bg-indigo-500",
                                ];
                                const color = colors[index % colors.length];
                                return (
                                  <div key={age.age_group} className="flex items-center gap-2 text-xs">
                                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                    <span className="flex-1 text-gray-600 dark:text-gray-400">
                                      {age.age_group}
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {age.count.toLocaleString()} ({age.percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Gender Distribution Pie Chart */}
                      {locality.gender_distribution.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                            {t("genderDistribution")}
                          </h5>
                          <div className="flex flex-col items-center gap-4">
                            {/* Pie Chart */}
                            <div className="relative w-48 h-48">
                              <svg className="transform -rotate-90 w-48 h-48">
                                <circle
                                  cx="96"
                                  cy="96"
                                  r="80"
                                  stroke="currentColor"
                                  strokeWidth="32"
                                  fill="none"
                                  className="text-gray-200 dark:text-gray-700"
                                />
                                {locality.gender_distribution.map((gender, index, array) => {
                                  const colors = ["text-blue-500", "text-pink-500", "text-purple-500"];
                                  const color = colors[index % colors.length];
                                  const previousSum = array
                                    .slice(0, index)
                                    .reduce((sum, item) => sum + item.percentage, 0);
                                  const percentage = gender.percentage;
                                  const circumference = 2 * Math.PI * 80;
                                  const offset = circumference * (previousSum / 100);
                                  const dashLength = (circumference * percentage) / 100;

                                  return (
                                    <circle
                                      key={gender.gender}
                                      cx="96"
                                      cy="96"
                                      r="80"
                                      stroke="currentColor"
                                      strokeWidth="32"
                                      fill="none"
                                      className={color}
                                      strokeDasharray={`${dashLength} ${circumference}`}
                                      strokeDashoffset={-offset}
                                    />
                                  );
                                })}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {locality.total_voters.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{t("total")}</div>
                                </div>
                              </div>
                            </div>
                            {/* Legend */}
                            <div className="w-full space-y-2">
                              {locality.gender_distribution.map((gender, index) => {
                                const colors = ["bg-blue-500", "bg-pink-500", "bg-purple-500"];
                                const color = colors[index % colors.length];
                                return (
                                  <div key={gender.gender} className="flex items-center gap-2 text-xs">
                                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                    <span className="flex-1 text-gray-600 dark:text-gray-400">
                                      {gender.gender}
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {gender.count.toLocaleString()} ({gender.percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Parliament */}
          {data.by_parliament.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="size-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("ageDistributionByParliament")}
                </h3>
              </div>
              <div className="space-y-6">
                {data.by_parliament.slice(0, 10).map((parliament) => (
                  <div key={parliament.parliament} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      {parliament.parliament} ({parliament.total_voters.toLocaleString()} {t("voters")})
                    </h4>
                    {parliament.age_distribution.length > 0 && (
                      <div className="space-y-2">
                        {parliament.age_distribution.map((age) => (
                          <div key={age.age_group} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{age.age_group}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {age.count.toLocaleString()} ({age.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
