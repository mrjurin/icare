"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import DataTable from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";

type Report = {
  id: string;
  title: string;
  cat: string;
  status: string;
  created: string;
  assignee: string;
};

type StatusFilter = "All" | "Pending" | "In Review" | "Resolved" | "Overdue";

type ReportsTableProps = {
  initialReports?: Report[];
  pagination?: PaginationProps;
};

export default function ReportsTable({ initialReports = [], pagination }: ReportsTableProps) {
  const t = useTranslations("dashboard.reportsTable");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "All"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const updateURL = (status: StatusFilter, search: string, page?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Preserve pagination
    if (page && page > 1) {
      params.set("page", page.toString());
    } else if (page === 1) {
      params.delete("page");
    }
    
    // Update filters
    if (status !== "All") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/admin/dashboard?${queryString}` : "/admin/dashboard", { scroll: false });
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    // Reset to page 1 when filter changes
    updateURL(status, searchQuery, 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Reset to page 1 when search changes
    updateURL(statusFilter, value, 1);
  };

  const filteredReports = useMemo(() => {
    let filtered = initialReports;

    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.id.toLowerCase().includes(query) ||
          report.title.toLowerCase().includes(query) ||
          report.cat.toLowerCase().includes(query) ||
          report.assignee.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [statusFilter, searchQuery, initialReports]);

  const statusFilters: StatusFilter[] = ["All", "Pending", "In Review", "Resolved", "Overdue"];

  const getStatusLabel = (status: StatusFilter): string => {
    if (status === "All") return t("all");
    if (status === "Pending") return tDashboard("pending");
    if (status === "In Review") return tDashboard("inReview");
    if (status === "Resolved") return tDashboard("resolved");
    if (status === "Overdue") return tDashboard("overdue");
    return status;
  };

  const getStatusTranslation = (status: string): string => {
    if (status === "Pending") return tDashboard("pending");
    if (status === "In Review") return tDashboard("inReview");
    if (status === "Resolved") return tDashboard("resolved");
    if (status === "Overdue") return tDashboard("overdue");
    return status;
  };

  const handleViewReport = (report: Report) => {
    // Extract ID from report (e.g., "#1298" -> "1298") and navigate to issue detail page
    const reportId = report.id.replace("#", "");
    router.push(`/admin/issues/${reportId}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleStatusChange(filter)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                statusFilter === filter
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {getStatusLabel(filter)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="rounded-lg h-10 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder={t("searchReports")}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable pagination={pagination ? { ...pagination, baseUrl: "/admin/dashboard" } : undefined}>
        <table className="min-w-full text-sm">
          <thead className="text-left bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("id")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("title")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("category")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("status")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("created")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t("assignee")}</th>
              <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredReports.length > 0 ? (
              filteredReports.map((r, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-primary">{r.id}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{r.title}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.cat}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(r.status)}`}>
                      {getStatusTranslation(r.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.created}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.assignee}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewReport(r)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                    >
                      {t("view")}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">{t("noReportsFound")}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {searchQuery || statusFilter !== "All" 
                        ? "Try adjusting your filters" 
                        : "No issues found"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
