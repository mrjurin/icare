"use client";

import { useEffect, useState } from "react";
import { getSprVoterDemographicReport, type SprVoterDemographicData } from "@/lib/actions/reports";
import { getVoterVersions, type SprVoterVersion } from "@/lib/actions/spr-voters";
import { Users, BarChart3, PieChart } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function SprDemographicReport() {
  const [versions, setVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<SprVoterDemographicData | null>(null);
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
        const result = await getSprVoterDemographicReport(selectedVersionId);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load SPR demographic data");
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
        <div className="text-gray-500">Loading SPR demographic data...</div>
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

      {/* Total Voters */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="size-8 text-primary" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Total SPR Voters</h3>
        </div>
        <div className="text-5xl font-bold text-gray-900 dark:text-white">
          {data.total_voters.toLocaleString()}
        </div>
        {selectedVersion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Version: {selectedVersion.name}</p>
        )}
      </div>

      {/* Key Demographics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        {data.age_distribution.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Age Distribution</h3>
            </div>
            <div className="space-y-4">
              {data.age_distribution.map((age) => (
                <div key={age.age_group}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {age.age_group}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {age.count.toLocaleString()} voters
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {age.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-primary flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(age.percentage, 100)}%` }}
                    >
                      {age.percentage >= 5 && (
                        <span className="text-xs font-semibold text-white">{age.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gender Distribution */}
        {data.gender_distribution.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gender Distribution</h3>
            </div>
            <div className="space-y-4">
              {data.gender_distribution.map((gender) => (
                <div key={gender.gender}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {gender.gender}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {gender.count.toLocaleString()} voters
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {gender.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(gender.percentage, 100)}%` }}
                    >
                      {gender.percentage >= 5 && (
                        <span className="text-xs font-semibold text-white">{gender.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Race Distribution */}
        {data.race_distribution.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Race Distribution</h3>
            </div>
            <div className="space-y-4">
              {data.race_distribution.slice(0, 10).map((race) => (
                <div key={race.race}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {race.race}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {race.count.toLocaleString()} voters
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {race.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-green-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(race.percentage, 100)}%` }}
                    >
                      {race.percentage >= 5 && (
                        <span className="text-xs font-semibold text-white">{race.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Religion Distribution */}
        {data.religion_distribution.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Religion Distribution</h3>
            </div>
            <div className="space-y-4">
              {data.religion_distribution.slice(0, 10).map((religion) => (
                <div key={religion.religion}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {religion.religion}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {religion.count.toLocaleString()} voters
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {religion.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-purple-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(religion.percentage, 100)}%` }}
                    >
                      {religion.percentage >= 5 && (
                        <span className="text-xs font-semibold text-white">{religion.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voters by Locality */}
      {data.by_locality.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voters by Locality
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Locality</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                    Total Voters
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.by_locality.slice(0, 20).map((locality) => (
                  <tr
                    key={locality.locality}
                    className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 font-medium">{locality.locality}</td>
                    <td className="px-4 py-3 text-right">{locality.total_voters.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
