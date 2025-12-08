"use client";

import { useTranslations } from "next-intl";
import type { AdunDashboardStats } from "@/lib/actions/reports";

interface AdunDashboardContentProps {
  stats: AdunDashboardStats | null;
}

export default function AdunDashboardContent({ stats }: AdunDashboardContentProps) {
  const t = useTranslations("dashboard");

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalZones")}</p>
          <p className="text-3xl font-bold text-primary">{stats.total_zones}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalVillages")}</p>
          <p className="text-3xl font-bold text-primary">{stats.total_villages}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalVoters")}</p>
          <p className="text-3xl font-bold text-primary">{stats.total_voters}</p>
        </div>
      </div>

      {/* Support Status */}
      {stats.support_status && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h3 className="text-lg font-semibold mb-4">{t("supportStatus")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("whiteSupporters")}</p>
              <p className="text-2xl font-bold text-green-600">{stats.support_status.white_supporters}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("blackNonSupporters")}</p>
              <p className="text-2xl font-bold text-red-600">{stats.support_status.black_non_supporters}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("redUndetermined")}</p>
              <p className="text-2xl font-bold text-orange-600">{stats.support_status.red_undetermined}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("supportScore")}</p>
              <p className="text-2xl font-bold text-primary">{stats.support_status.support_score.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Age Distribution */}
      {stats.age_distribution && stats.age_distribution.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h3 className="text-lg font-semibold mb-4">{t("ageDistribution")}</h3>
          <div className="space-y-2">
            {stats.age_distribution.map((age, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{age.age_group}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${age.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {age.count} ({age.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voters by Locality */}
      {stats.voters_by_locality && stats.voters_by_locality.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h3 className="text-lg font-semibold mb-4">{t("votersByLocality")}</h3>
          <div className="space-y-2">
            {stats.voters_by_locality.map((locality, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{locality.locality}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${locality.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {locality.count} ({locality.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
