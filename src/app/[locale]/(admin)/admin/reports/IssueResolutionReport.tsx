"use client";

import { useEffect, useState } from "react";
import { getIssueResolutionReport, getDetailedIssuesForExport, type IssueResolutionData } from "@/lib/actions/reports";
import { FileCheck, CheckCircle, Clock, AlertCircle, XCircle, TrendingUp, Download, FileSpreadsheet } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportData, generateTimestamp } from "@/lib/utils/export";

export default function IssueResolutionReport() {
  const [data, setData] = useState<IssueResolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingDetailed, setExportingDetailed] = useState(false);

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

  const handleDetailedExport = async () => {
    if (!data) return;
    
    try {
      setExportingDetailed(true);
      const result = await getDetailedIssuesForExport();
      
      if (result.success && result.data) {
        const timestamp = generateTimestamp();
        const filename = `detailed_issues_export_${timestamp}`;
        
        // Format the detailed data for CSV export
        const csvData = result.data.map(issue => ({
          issue_id: issue.id,
          title: issue.title || 'N/A',
          description: issue.description || 'N/A',
          category: issue.category || 'N/A',
          priority: issue.priority || 'medium',
          status: issue.status || 'pending',
          zone_name: issue.zone_name || 'N/A',
          locality_name: issue.locality_name || 'N/A',
          reporter_name: issue.reporter_name || 'N/A',
          assignee_name: issue.assignee_name || 'N/A',
          created_at: issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'N/A',
          resolved_at: issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : 'N/A',
          resolution_days: issue.resolution_days || 0,
          latitude: issue.lat || '',
          longitude: issue.lng || ''
        }));
        
        exportData({ filename, format: 'csv', data: csvData });
      } else {
        console.error('Failed to fetch detailed issues:', result.error);
      }
    } catch (error) {
      console.error('Error exporting detailed issues:', error);
    } finally {
      setExportingDetailed(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!data) return;
    
    const timestamp = generateTimestamp();
    const filename = `issue_resolution_report_${timestamp}`;
    
    if (format === 'json') {
      // For JSON, export the complete data structure
      const exportDataObj = {
        report_type: 'Issue Resolution Report',
        generated_at: new Date().toISOString(),
        summary: {
          total_issues: data.total_issues,
          resolved_issues: data.resolved_issues,
          pending_issues: data.pending_issues,
          in_progress_issues: data.in_progress_issues,
          closed_issues: data.closed_issues,
          resolution_rate: data.resolution_rate,
          average_resolution_time_days: data.average_resolution_time_days,
        },
        issues_by_category: data.issues_by_category,
        issues_by_zone: data.issues_by_zone,
        issues_by_priority: data.issues_by_priority
      };
      
      exportData({ filename, format, data: exportDataObj });
    } else {
      // For CSV, create a comprehensive flat structure with all data
      const csvData = [
        // Summary row
        {
          data_type: 'Summary',
          category: 'Overall',
          zone_name: 'All Zones',
          priority: 'All Priorities',
          total_issues: data.total_issues,
          resolved_issues: data.resolved_issues,
          pending_issues: data.pending_issues,
          in_progress_issues: data.in_progress_issues,
          closed_issues: data.closed_issues,
          resolution_rate: data.resolution_rate,
          average_resolution_time_days: data.average_resolution_time_days,
          percentage_of_total: 100
        },
        // Category breakdown
        ...data.issues_by_category.map(item => ({
          data_type: 'Category Breakdown',
          category: item.category,
          zone_name: 'All Zones',
          priority: 'All Priorities',
          total_issues: item.total,
          resolved_issues: item.resolved,
          pending_issues: item.total - item.resolved,
          in_progress_issues: 0,
          closed_issues: 0,
          resolution_rate: item.resolution_rate,
          average_resolution_time_days: data.average_resolution_time_days,
          percentage_of_total: data.total_issues > 0 ? Number(((item.total / data.total_issues) * 100).toFixed(2)) : 0
        })),
        // Zone breakdown
        ...data.issues_by_zone.map(item => ({
          data_type: 'Zone Breakdown',
          category: 'All Categories',
          zone_name: item.zone_name,
          priority: 'All Priorities',
          total_issues: item.total,
          resolved_issues: item.resolved,
          pending_issues: item.total - item.resolved,
          in_progress_issues: 0,
          closed_issues: 0,
          resolution_rate: item.resolution_rate,
          average_resolution_time_days: data.average_resolution_time_days,
          percentage_of_total: data.total_issues > 0 ? Number(((item.total / data.total_issues) * 100).toFixed(2)) : 0
        })),
        // Priority breakdown
        ...data.issues_by_priority.map(item => ({
          data_type: 'Priority Breakdown',
          category: 'All Categories',
          zone_name: 'All Zones',
          priority: item.priority,
          total_issues: item.total,
          resolved_issues: item.resolved,
          pending_issues: item.total - item.resolved,
          in_progress_issues: 0,
          closed_issues: 0,
          resolution_rate: item.resolution_rate,
          average_resolution_time_days: data.average_resolution_time_days,
          percentage_of_total: data.total_issues > 0 ? Number(((item.total / data.total_issues) * 100).toFixed(2)) : 0
        }))
      ];
      
      exportData({ filename, format, data: csvData });
    }
  };

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
      {/* Header with Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Issue Resolution Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Issue resolution rates and response times
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={!data}
            className="gap-2"
          >
            <Download className="size-4" />
            Export Summary CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleDetailedExport}
            disabled={!data || exportingDetailed}
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            {exportingDetailed ? 'Exporting...' : 'Export Detailed CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={!data}
            className="gap-2"
          >
            <Download className="size-4" />
            Export JSON
          </Button>
        </div>
      </div>

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

      {/* Issues by Zone */}
      {data.issues_by_zone && data.issues_by_zone.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Issues by Zone
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Zone</th>
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
                {data.issues_by_zone.map((zone, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 font-medium">{zone.zone_name}</td>
                    <td className="px-4 py-3 text-right">{zone.total}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      {zone.resolved}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={
                            zone.resolution_rate >= 70
                              ? "text-green-600 dark:text-green-400"
                              : zone.resolution_rate >= 50
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {zone.resolution_rate}%
                        </span>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${zone.resolution_rate >= 70 ? "bg-green-500" : zone.resolution_rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${zone.resolution_rate}%` }}
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
      )}

      {/* Issues by Priority */}
      {data.issues_by_priority && data.issues_by_priority.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Issues by Priority
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Priority</th>
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
                {data.issues_by_priority.map((priority, index) => {
                  const getPriorityColor = (priorityName: string) => {
                    const p = priorityName.toLowerCase();
                    if (p === "critical") {
                      return {
                        badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                        text: "text-red-600 dark:text-red-400",
                        bar: "bg-red-500",
                      };
                    } else if (p === "high") {
                      return {
                        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                        text: "text-orange-600 dark:text-orange-400",
                        bar: "bg-orange-500",
                      };
                    } else if (p === "medium") {
                      return {
                        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                        text: "text-yellow-600 dark:text-yellow-400",
                        bar: "bg-yellow-500",
                      };
                    } else {
                      return {
                        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                        text: "text-blue-600 dark:text-blue-400",
                        bar: "bg-blue-500",
                      };
                    }
                  };

                  const colors = getPriorityColor(priority.priority);

                  return (
                    <tr
                      key={index}
                      className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                          {priority.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{priority.total}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                        {priority.resolved}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              priority.resolution_rate >= 70
                                ? "text-green-600 dark:text-green-400"
                                : priority.resolution_rate >= 50
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {priority.resolution_rate}%
                          </span>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${priority.resolution_rate >= 70 ? "bg-green-500" : priority.resolution_rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${priority.resolution_rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
