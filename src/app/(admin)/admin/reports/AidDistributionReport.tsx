"use client";

import { useEffect, useState } from "react";
import { getAidDistributionReport, type AidDistributionData } from "@/lib/actions/reports";
import { Package, Home, Users, TrendingUp } from "lucide-react";

export default function AidDistributionReport() {
  const [data, setData] = useState<AidDistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getAidDistributionReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load aid distribution data");
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
        <div className="text-gray-500">Loading aid distribution data...</div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Distributions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_distributions.toLocaleString()}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Households Served</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_households_served.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">People Served</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_people_served.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distributions by Type */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distributions by Aid Type
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Aid Type</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Distributions
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  Total Quantity
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                  People Served
                </th>
              </tr>
            </thead>
            <tbody>
              {data.distributions_by_type.map((type, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3 font-medium">{type.aid_type}</td>
                  <td className="px-4 py-3 text-right">{type.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{type.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{type.people_served.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distributions by Zone */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distributions by Zone
        </h3>
        <div className="space-y-3">
          {data.distributions_by_zone.map((zone, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{zone.zone_name}</h4>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{zone.distributions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">distributions</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Households Served</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {zone.households_served.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">People Served</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {zone.people_served.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      {data.monthly_trend.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Distribution Trend
            </h3>
          </div>
          <div className="space-y-3">
            {data.monthly_trend.map((month, index) => {
              const maxDistributions = Math.max(
                ...data.monthly_trend.map(m => m.distributions),
                1
              );
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(month.month + "-01").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                    <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(month.distributions / maxDistributions) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {month.distributions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {month.households_served} households
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
