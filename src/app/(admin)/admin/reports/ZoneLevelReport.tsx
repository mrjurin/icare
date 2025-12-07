"use client";

import { useEffect, useState } from "react";
import { getZoneLevelReport, type ZoneLevelData } from "@/lib/actions/reports";
import { MapPin, Users, Home, TrendingUp, CheckCircle, Clock, Package, AlertCircle } from "lucide-react";

export default function ZoneLevelReport() {
  const [data, setData] = useState<ZoneLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getZoneLevelReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load zone level data");
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
        <div className="text-gray-500">Loading zone level data...</div>
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="size-4 text-blue-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Zones</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_zones}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="size-4 text-green-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Households</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_households.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-4 text-purple-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Voters</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_eligible_voters.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-orange-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Overall Support</p>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(data.summary.overall_support_score)}`}>
            {data.summary.overall_support_score}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="size-4 text-indigo-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Resolution Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.overall_resolution_rate}%
          </p>
        </div>
      </div>

      {/* Zone Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Zone Details
        </h3>
        <div className="space-y-4">
          {data.zones
            .sort((a, b) => b.support_score - a.support_score)
            .map((zone) => (
              <div
                key={zone.zone_id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {zone.zone_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {zone.villages_count} villages • {zone.total_households} households
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(zone.support_score)}`}>
                      {zone.support_score}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Support Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="size-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Eligible Voters</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {zone.total_eligible_voters.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">White Supporters</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {zone.white_supporters.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Issues Resolved</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {zone.resolved_issues} / {zone.total_issues}
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="size-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Aid Distributions</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {zone.aid_distributions.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Support Score</span>
                      <span className="font-medium">{zone.support_score}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(zone.support_score)}`}
                        style={{ width: `${zone.support_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Issue Resolution Rate</span>
                      <span className="font-medium">{zone.resolution_rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${zone.resolution_rate >= 70 ? "bg-green-500" : zone.resolution_rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${zone.resolution_rate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 bg-white border border-gray-400 rounded"></div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">White</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {zone.white_supporters}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 bg-gray-900 rounded"></div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Black</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {zone.black_non_supporters}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Red</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {zone.red_undetermined}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Unclassified</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {zone.unclassified}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
