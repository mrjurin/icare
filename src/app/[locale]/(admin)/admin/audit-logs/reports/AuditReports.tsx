"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getAuditLogStats, exportAuditLogs, type AuditLogStats } from "@/lib/actions/audit-logs";
import { useTranslations } from "next-intl";

type AuditReportsProps = {
  stats: AuditLogStats | null;
  initialFilters: {
    startDate?: string;
    endDate?: string;
  };
};

export default function AuditReports({
  stats: initialStats,
  initialFilters,
}: AuditReportsProps) {
  const t = useTranslations("auditLogs.reports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<AuditLogStats | null>(initialStats);

  const [startDate, setStartDate] = useState(initialFilters.startDate || "");
  const [endDate, setEndDate] = useState(initialFilters.endDate || "");

  const updateFilters = () => {
    const params = new URLSearchParams();

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);

    // Refresh stats
    startTransition(async () => {
      const result = await getAuditLogStats(
        startDate || undefined,
        endDate || undefined
      );
      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportAuditLogs({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (result.success && result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    });
  };

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("filters.startDate")}:
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("filters.endDate")}:
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <Button onClick={updateFilters} disabled={isPending}>
            {t("filters.apply")}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isPending}
            className="gap-2"
          >
            <Download className="size-4" />
            {t("filters.export")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.totalEvents")}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.successful")}
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.bySuccess.success.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.failed")}
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {stats.bySuccess.failed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <XCircle className="size-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.successRate")}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total > 0
                  ? ((stats.bySuccess.success / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Event Types */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="size-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("charts.topEventTypes")}
            </h3>
          </div>
          <div className="space-y-3">
            {stats.byEventType.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("charts.noData")}</p>
            ) : (
              stats.byEventType.map((item, index) => {
                const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                return (
                  <div key={item.event_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.event_type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Entity Types */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("charts.topEntityTypes")}
            </h3>
          </div>
          <div className="space-y-3">
            {stats.byEntityType.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("charts.noData")}</p>
            ) : (
              stats.byEntityType.map((item) => {
                const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                return (
                  <div key={item.entity_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.entity_type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("charts.topUsers")}
            </h3>
          </div>
          <div className="space-y-3">
            {stats.byUser.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("charts.noData")}</p>
            ) : (
              stats.byUser.map((item) => {
                const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                return (
                  <div key={item.user_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.user_name || item.user_email}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("charts.recentActivity")}
            </h3>
          </div>
          <div className="space-y-2">
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("charts.noData")}</p>
            ) : (
              stats.recentActivity.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.count.toLocaleString()} {t("charts.events")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
