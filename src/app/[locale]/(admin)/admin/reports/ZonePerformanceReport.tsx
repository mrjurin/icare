"use client";

import { useEffect, useState } from "react";
import { getZonePerformanceReport, type ZonePerformanceData } from "@/lib/actions/reports";
import { BarChart3, Users, Home, CheckCircle, Clock, Package, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportData, generateTimestamp } from "@/lib/utils/export";

export default function ZonePerformanceReport() {
  const [data, setData] = useState<ZonePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getZonePerformanceReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load zone performance data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = (format: 'csv' | 'json') => {
    if (!data) return;
    
    const timestamp = generateTimestamp();
    const filename = `zone_performance_report_${timestamp}`;
    
    // Prepare export data
    const exportDataObj = {
      report_type: 'Zone Performance Report',
      generated_at: new Date().toISOString(),
      zones: data.zones
    };
    
    exportData({ filename, format, data: exportDataObj });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading zone performance data...</div>
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

  if (!data || data.zones.length === 0) {
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
            Zone Performance Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Performance metrics for each zone
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
            Export CSV
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="size-4 text-blue-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Zones</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.zones.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-4 text-green-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Voters</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.zones.reduce((sum, z) => sum + z.eligible_voters, 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="size-4 text-purple-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Resolution Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.zones.length > 0
              ? (
                  data.zones.reduce((sum, z) => sum + z.resolution_rate, 0) / data.zones.length
                ).toFixed(1)
              : "0"}
            %
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="size-4 text-orange-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Coverage Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.zones.length > 0
              ? (
                  data.zones.reduce((sum, z) => sum + z.coverage_rate, 0) / data.zones.length
                ).toFixed(1)
              : "0"}
            %
          </p>
        </div>
      </div>

      {/* Zone Performance Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Zone Performance Details
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Zone</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Households
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  People
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Voters
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Issues
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Resolved
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Resolution Rate
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Aid Coverage
                </th>
              </tr>
            </thead>
            <tbody>
              {data.zones
                .sort((a, b) => b.resolution_rate - a.resolution_rate)
                .map((zone) => (
                  <tr
                    key={zone.zone_id}
                    className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 font-medium">{zone.zone_name}</td>
                    <td className="px-4 py-3 text-right">{zone.total_households.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{zone.total_people.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{zone.eligible_voters.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{zone.issues_total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-600 dark:text-green-400">
                        {zone.issues_resolved.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={zone.resolution_rate >= 70 ? "text-green-600 dark:text-green-400" : zone.resolution_rate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{zone.coverage_rate}%</span>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${zone.coverage_rate}%` }}
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
