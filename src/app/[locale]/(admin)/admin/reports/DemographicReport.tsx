"use client";

import { useEffect, useState } from "react";
import { getDemographicReport, type DemographicData } from "@/lib/actions/reports";
import { Users, Home, PieChart, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportData, generateTimestamp } from "@/lib/utils/export";

export default function DemographicReport() {
  const [data, setData] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getDemographicReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load demographic data");
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
    const filename = `demographic_report_${timestamp}`;
    
    // Prepare export data
    const exportDataObj = {
      report_type: 'Demographic Report',
      generated_at: new Date().toISOString(),
      total_people: data.total_people,
      total_households: data.total_households,
      age_distribution: data.age_distribution,
      dependency_status: data.dependency_status,
      income_distribution: data.income_distribution
    };
    
    exportData({ filename, format, data: exportDataObj });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading demographic data...</div>
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
            Demographic Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Age, income, and dependency status distribution
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total People</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_people.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Home className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Households</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_households.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="size-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Age Distribution
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.age_distribution.map((age, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {age.age_group} years
                </p>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${age.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {age.count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {age.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dependency Status */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dependency Status
        </h3>
        <div className="space-y-3">
          {data.dependency_status.map((status, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {status.status}
                </p>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.status === "Independent" ? "bg-green-500" : "bg-orange-500"}`}
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {status.count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Distribution */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Income Distribution
        </h3>
        <div className="space-y-3">
          {data.income_distribution.map((income, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {income.income_range}
                </p>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${income.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {income.count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {income.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
