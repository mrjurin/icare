"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Download,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FileText,
  Activity,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import { exportAuditLogs, type AuditLog } from "@/lib/actions/audit-logs";
import { useTranslations } from "next-intl";

type AuditLogFilters = {
  search?: string;
  eventType?: string;
  entityType?: string;
  userId?: number;
  success?: boolean;
  startDate?: string;
  endDate?: string;
};

type AuditLogsTableProps = {
  auditLogs: AuditLog[];
  pagination?: PaginationProps | null;
  filterOptions: {
    eventTypes: string[];
    entityTypes: string[];
    users: Array<{ id: number; email: string; name: string }>;
  } | null;
  initialFilters: AuditLogFilters;
};

export default function AuditLogsTable({
  auditLogs,
  pagination,
  filterOptions,
  initialFilters,
}: AuditLogsTableProps) {
  const t = useTranslations("auditLogs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(initialFilters.search || "");
  const [eventType, setEventType] = useState(initialFilters.eventType || "");
  const [entityType, setEntityType] = useState(initialFilters.entityType || "");
  const [userId, setUserId] = useState(initialFilters.userId?.toString() || "");
  const [success, setSuccess] = useState(
    initialFilters.success !== undefined
      ? initialFilters.success.toString()
      : ""
  );
  const [startDate, setStartDate] = useState(initialFilters.startDate || "");
  const [endDate, setEndDate] = useState(initialFilters.endDate || "");

  const updateFilters = () => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (eventType) params.set("eventType", eventType);
    if (entityType) params.set("entityType", entityType);
    if (userId) params.set("userId", userId);
    if (success) params.set("success", success);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    // Remove page when filters change
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleReset = () => {
    setSearch("");
    setEventType("");
    setEntityType("");
    setUserId("");
    setSuccess("");
    setStartDate("");
    setEndDate("");
    router.push(pathname);
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportAuditLogs({
        search: search || undefined,
        eventType: eventType || undefined,
        entityType: entityType || undefined,
        userId: userId ? parseInt(userId, 10) : undefined,
        success:
          success === "true" ? true : success === "false" ? false : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (result.success && result.data) {
        // Download CSV
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    });
  };

  const hasActiveFilters =
    search || eventType || entityType || userId || success || startDate || endDate;

  return (
    <>
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="size-4" />
            {t("filters.showFilters")}
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                {[
                  eventType,
                  entityType,
                  userId,
                  success,
                  startDate,
                  endDate,
                ].filter(Boolean).length}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <X className="size-4" />
              {t("filters.reset")}
            </Button>
          )}

          <Button
            onClick={handleSearch}
            disabled={isPending}
            className="gap-2"
          >
            {t("filters.search")}
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.eventType")}
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t("filters.all")}</option>
                {filterOptions?.eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.entityType")}
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t("filters.all")}</option>
                {filterOptions?.entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.user")}
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t("filters.all")}</option>
                {filterOptions?.users.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.success")}
              </label>
              <select
                value={success}
                onChange={(e) => setSuccess(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{t("filters.all")}</option>
                <option value="true">{t("filters.successOnly")}</option>
                <option value="false">{t("filters.failedOnly")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.startDate")}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("filters.endDate")}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <DataTable pagination={pagination || undefined}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.timestamp")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.eventType")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.entity")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.user")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.action")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.ipAddress")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("table.details")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {auditLogs.length === 0 ? (
              <DataTableEmpty
                message={t("table.noLogs")}
                icon={<Activity className="size-12 text-gray-400" />}
                colSpan={8}
              />
            ) : (
              auditLogs.map((log) => {
                let details: Record<string, unknown> | null = null;
                try {
                  if (log.details) {
                    details = JSON.parse(log.details);
                  }
                } catch {
                  // Ignore parse errors
                }

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-gray-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        <Activity className="size-3 mr-1" />
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        <div className="font-medium">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="text-xs text-gray-500">
                            ID: {log.entity_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {log.user_email ? (
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {log.user_name || log.user_email}
                            </div>
                            {log.user_role && (
                              <div className="text-xs text-gray-500">
                                {log.user_role}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-gray-400" />
                        <span className="max-w-xs truncate">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          <CheckCircle2 className="size-3" />
                          {t("table.success")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                          <XCircle className="size-3" />
                          {t("table.failed")}
                        </span>
                      )}
                      {log.error_message && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.ip_address || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {details ? (
                        <details className="cursor-pointer">
                          <summary className="text-primary hover:underline">
                            {t("table.viewDetails")}
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto max-w-md">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTable>
    </>
  );
}
