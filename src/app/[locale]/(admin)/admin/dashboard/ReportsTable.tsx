"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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
};

export default function ReportsTable({ initialReports = [] }: ReportsTableProps) {
  const t = useTranslations("dashboard.reportsTable");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "All"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const updateURL = (status: StatusFilter, search: string) => {
    const params = new URLSearchParams();
    if (status !== "All") {
      params.set("status", status);
    }
    if (search) {
      params.set("search", search);
    }
    const queryString = params.toString();
    router.push(queryString ? `/admin/dashboard?${queryString}` : "/admin/dashboard", { scroll: false });
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    updateURL(status, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateURL(statusFilter, value);
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleStatusChange(filter)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                statusFilter === filter
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
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
            className="rounded-lg h-10 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t("searchReports")}
          />
          <button className="rounded-lg h-10 px-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {t("filters")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <table className="min-w-full text-sm">
          <thead className="text-left bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">{t("id")}</th>
              <th className="px-4 py-3">{t("title")}</th>
              <th className="px-4 py-3">{t("category")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3">{t("created")}</th>
              <th className="px-4 py-3">{t("assignee")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((r, i) => (
                <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3">{r.cat}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800">
                      {getStatusTranslation(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.created}</td>
                  <td className="px-4 py-3">{r.assignee}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewReport(r)}
                      className="rounded-md px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t("view")}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {t("noReportsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
