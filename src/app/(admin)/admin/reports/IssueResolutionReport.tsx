"use client";

import { useEffect, useState } from "react";
import { getIssueResolutionReport, type IssueResolutionData } from "@/lib/actions/reports";
import { FileCheck, CheckCircle, Clock, AlertCircle, XCircle, TrendingUp } from "lucide-react";

export default function IssueResolutionReport() {
  const [data, setData] = useState<IssueResolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getIssueResolutionReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load issue resolution data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading issue resolution data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileCheck className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_issues.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.resolved_issues.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.pending_issues.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.resolution_rate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Issue Status Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Resolved</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.resolved_issues}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.total_issues > 0
                    ? ((data.resolved_issues / data.total_issues) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Pending</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.pending_issues}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.total_issues > 0
                    ? ((data.pending_issues / data.total_issues) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">In Progress</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.in_progress_issues}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.total_issues > 0
                    ? ((data.in_progress_issues / data.total_issues) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Closed</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.closed_issues}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.total_issues > 0
                    ? ((data.closed_issues / data.total_issues) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.resolution_rate}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${data.resolution_rate >= 70 ? "bg-green-500" : data.resolution_rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${data.resolution_rate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Average Resolution Time
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.average_resolution_time_days} days
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${data.average_resolution_time_days <= 3 ? "bg-green-500" : data.average_resolution_time_days <= 7 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{
                    width: `${Math.min(100, (data.average_resolution_time_days / 14) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues by Category */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Issues by Category
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Category</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Total
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Resolved
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Resolution Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {data.issues_by_category.map((category, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3 font-medium">{category.category}</td>
                  <td className="px-4 py-3 text-right">{category.total}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                    {category.resolved}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={
                          category.resolution_rate >= 70
                            ? "text-green-600 dark:text-green-400"
                            : category.resolution_rate >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {category.resolution_rate}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${category.resolution_rate >= 70 ? "bg-green-500" : category.resolution_rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${category.resolution_rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
