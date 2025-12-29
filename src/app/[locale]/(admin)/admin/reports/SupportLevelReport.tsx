"use client";

import { useEffect, useState } from "react";
import { getSupportLevelReport, type SupportLevelData } from "@/lib/actions/reports";
import { TrendingUp, Users, Circle, AlertCircle, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportData, generateTimestamp } from "@/lib/utils/export";

export default function SupportLevelReport() {
  const [data, setData] = useState<SupportLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getSupportLevelReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load support level data");
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
    const filename = `support_level_report_${timestamp}`;
    
    // Prepare export data
    const exportDataObj = {
      report_type: 'Support Level Report',
      generated_at: new Date().toISOString(),
      overall_support_score: data.overall_support_score,
      total_eligible_voters: data.total_eligible_voters,
      total_white_supporters: data.total_white_supporters,
      total_black_non_supporters: data.total_black_non_supporters,
      total_red_undetermined: data.total_red_undetermined,
      total_unclassified: data.total_unclassified,
      zones: data.zones
    };
    
    exportData({ filename, format, data: exportDataObj });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading support level data...</div>
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

  const classifiedVoters = data.total_white_supporters + data.total_black_non_supporters + data.total_red_undetermined;
  const classifiedPercentage = data.total_eligible_voters > 0
    ? ((classifiedVoters / data.total_eligible_voters) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Support Level Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Support scores based on aid and issue resolution
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

      {/* Overall Support Score */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TrendingUp className="size-8 text-primary" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Overall Support Score
          </h3>
        </div>
        <div className="relative inline-flex items-center justify-center">
          <div className="relative">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.overall_support_score / 100)}`}
                className={getScoreColor(data.overall_support_score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(data.overall_support_score)}`}>
                {data.overall_support_score}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Based on voting support status (White: Supporting, Black: Not Supporting, Red: Undetermined)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {classifiedPercentage}% of voters have been classified
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-white border-2 border-gray-400 rounded-lg">
              <Circle className="size-5 text-gray-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">White (Supporting)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_white_supporters.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_eligible_voters > 0
                  ? ((data.total_white_supporters / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                % of voters
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-900 rounded-lg">
              <Circle className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Black (Not Supporting)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_black_non_supporters.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_eligible_voters > 0
                  ? ((data.total_black_non_supporters / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                % of voters
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-red-600 rounded-lg">
              <AlertCircle className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Red (Undetermined)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_red_undetermined.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_eligible_voters > 0
                  ? ((data.total_red_undetermined / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                % of voters
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
              <Users className="size-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Unclassified</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                {data.total_unclassified.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                {data.total_eligible_voters > 0
                  ? ((data.total_unclassified / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                % of voters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Breakdown Chart */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Support Breakdown
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded"></div>
                <span className="font-medium text-gray-900 dark:text-white">White (Supporting)</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.total_white_supporters.toLocaleString()} (
                {data.total_eligible_voters > 0
                  ? ((data.total_white_supporters / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                %)
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-white border-2 border-gray-400"
                style={{
                  width: `${data.total_eligible_voters > 0 ? (data.total_white_supporters / data.total_eligible_voters) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-900 rounded"></div>
                <span className="font-medium text-gray-900 dark:text-white">Black (Not Supporting)</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.total_black_non_supporters.toLocaleString()} (
                {data.total_eligible_voters > 0
                  ? ((data.total_black_non_supporters / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                %)
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900"
                style={{
                  width: `${data.total_eligible_voters > 0 ? (data.total_black_non_supporters / data.total_eligible_voters) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="font-medium text-gray-900 dark:text-white">Red (Undetermined)</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.total_red_undetermined.toLocaleString()} (
                {data.total_eligible_voters > 0
                  ? ((data.total_red_undetermined / data.total_eligible_voters) * 100).toFixed(1)
                  : "0"}
                %)
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600"
                style={{
                  width: `${data.total_eligible_voters > 0 ? (data.total_red_undetermined / data.total_eligible_voters) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {data.total_unclassified > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Unclassified</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data.total_unclassified.toLocaleString()} (
                  {data.total_eligible_voters > 0
                    ? ((data.total_unclassified / data.total_eligible_voters) * 100).toFixed(1)
                    : "0"}
                  %)
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-300 dark:bg-gray-600"
                  style={{
                    width: `${data.total_eligible_voters > 0 ? (data.total_unclassified / data.total_eligible_voters) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone Support Scores */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Support Level by Zone
        </h3>
        <div className="space-y-4">
          {data.zones
            .sort((a, b) => b.support_score - a.support_score)
            .map((zone) => {
              const zoneClassified = zone.white_supporters + zone.black_non_supporters + zone.red_undetermined;
              return (
                <div
                  key={zone.zone_id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {zone.zone_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {zone.total_eligible_voters} eligible voters
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(zone.support_score)}`}>
                        {zone.support_score}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Support Score</p>
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-3 h-3 bg-white border border-gray-400 rounded"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">White</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {zone.white_supporters}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.total_eligible_voters > 0
                            ? ((zone.white_supporters / zone.total_eligible_voters) * 100).toFixed(1)
                            : "0"}
                          %
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.total_eligible_voters > 0
                            ? ((zone.black_non_supporters / zone.total_eligible_voters) * 100).toFixed(1)
                            : "0"}
                          %
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.total_eligible_voters > 0
                            ? ((zone.red_undetermined / zone.total_eligible_voters) * 100).toFixed(1)
                            : "0"}
                          %
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.total_eligible_voters > 0
                            ? ((zone.unclassified / zone.total_eligible_voters) * 100).toFixed(1)
                            : "0"}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
