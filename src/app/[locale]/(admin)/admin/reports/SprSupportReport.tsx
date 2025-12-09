"use client";

import { useEffect, useState } from "react";
import { getSprVoterSupportReport, type SprVoterSupportData } from "@/lib/actions/reports";
import { getVoterVersions, type SprVoterVersion } from "@/lib/actions/spr-voters";
import { TrendingUp, Users, Circle, AlertCircle, BarChart3, PieChart } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function SprSupportReport() {
  const [versions, setVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<SprVoterSupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load versions on mount
  useEffect(() => {
    async function loadVersions() {
      try {
        const result = await getVoterVersions();
        if (result.success && result.data) {
          setVersions(result.data);
          // Auto-select active version if available
          const activeVersion = result.data.find(v => v.is_active);
          if (activeVersion) {
            setSelectedVersionId(activeVersion.id);
          }
        }
      } catch (err) {
        console.error("Failed to load versions:", err);
      }
    }
    loadVersions();
  }, []);

  // Load report data when version changes
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getSprVoterSupportReport(selectedVersionId);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load SPR support data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedVersionId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading SPR support data...</div>
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
        <div className="text-gray-500">No SPR data available</div>
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

  const classifiedVoters =
    data.total_white_supporters + data.total_black_non_supporters + data.total_red_undetermined;
  const classifiedPercentage =
    data.total_voters > 0 ? ((classifiedVoters / data.total_voters) * 100).toFixed(1) : "0";

  const versionOptions = versions.map((v) => ({
    value: v.id,
    label: v.name,
    description: v.description || undefined,
  }));

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <div className="space-y-6">
      {/* Version Selector */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Select SPR Version:
          </label>
          <div className="flex-1 max-w-md">
            <SearchableSelect
              options={versionOptions}
              value={selectedVersionId || ""}
              onChange={(value) =>
                setSelectedVersionId(typeof value === "number" ? value : parseInt(value as string, 10))
              }
              placeholder="Select version (or leave empty for all versions)"
              searchPlaceholder="Search versions..."
            />
          </div>
          {selectedVersion && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedVersion.is_active && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full">
                  Active
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Total Voters Summary */}
      <div className="rounded-lg border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="size-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total SPR Voters</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">
                {data.total_voters.toLocaleString()}
              </p>
            </div>
          </div>
          {selectedVersion && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {selectedVersion.name}
              </p>
            </div>
          )}
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
          Based on voting support status (White: supporting, Black: not supporting, Red: undetermined)
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
                {data.total_voters > 0
                  ? ((data.total_white_supporters / data.total_voters) * 100).toFixed(1)
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
                {data.total_voters > 0
                  ? ((data.total_black_non_supporters / data.total_voters) * 100).toFixed(1)
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
                {data.total_voters > 0
                  ? ((data.total_red_undetermined / data.total_voters) * 100).toFixed(1)
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
                {data.total_voters > 0
                  ? ((data.total_unclassified / data.total_voters) * 100).toFixed(1)
                  : "0"}
                % of voters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Score by Locality */}
      {data.by_locality.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Support Score by Locality
            </h3>
          </div>
          <div className="space-y-4">
            {data.by_locality
              .sort((a, b) => b.support_score - a.support_score)
              .slice(0, 20)
              .map((locality) => (
                <div key={locality.locality}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {locality.locality}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {locality.total_voters} voters
                      </span>
                      <span className={`text-sm font-bold ${getScoreColor(locality.support_score)}`}>
                        {locality.support_score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full ${getScoreBgColor(locality.support_score)} flex items-center justify-end pr-2`}
                      style={{ width: `${Math.min(locality.support_score, 100)}%` }}
                    >
                      {locality.support_score >= 10 && (
                        <span className="text-xs font-semibold text-white">
                          {locality.support_score.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
