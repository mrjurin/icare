"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Report = {
  id: string;
  title: string;
  cat: string;
  status: string;
  created: string;
  assignee: string;
};

type StatusFilter = "All" | "Pending" | "In Review" | "Resolved" | "Overdue";

const mockReports: Report[] = [
  { id: "#1298", title: "Streetlight outage at Jalan 3", cat: "Infrastructure", status: "Pending", created: "2025-11-29", assignee: "Unassigned" },
  { id: "#1297", title: "Blocked drain near Pasar", cat: "Sanitation", status: "In Review", created: "2025-11-28", assignee: "A. Rahman" },
  { id: "#1296", title: "Potholes along Inanam Road", cat: "Roads", status: "Resolved", created: "2025-11-25", assignee: "M. Tan" },
  { id: "#1295", title: "Broken water pipe at Taman", cat: "Utilities", status: "Pending", created: "2025-11-27", assignee: "Unassigned" },
  { id: "#1294", title: "Garbage collection delay", cat: "Sanitation", status: "Overdue", created: "2025-11-20", assignee: "M. Tan" },
  { id: "#1293", title: "Road repair needed", cat: "Roads", status: "Resolved", created: "2025-11-22", assignee: "A. Rahman" },
  { id: "#1292", title: "Street sign missing", cat: "Infrastructure", status: "In Review", created: "2025-11-26", assignee: "A. Rahman" },
];

export default function ReportsTable() {
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
    let filtered = mockReports;

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
  }, [statusFilter, searchQuery]);

  const statusFilters: StatusFilter[] = ["All", "Pending", "In Review", "Resolved", "Overdue"];

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
              {filter}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="rounded-lg h-10 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search reports"
          />
          <button className="rounded-lg h-10 px-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <table className="min-w-full text-sm">
          <thead className="text-left bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Assignee</th>
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
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.created}</td>
                  <td className="px-4 py-3">{r.assignee}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No reports found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
