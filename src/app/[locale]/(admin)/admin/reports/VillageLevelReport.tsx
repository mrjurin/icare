"use client";

import { useEffect, useState } from "react";
import { getVillageLevelReport, type VillageLevelData } from "@/lib/actions/reports";
import { Home, Users, MapPin, TrendingUp, Package, Circle, AlertCircle, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportData, generateTimestamp } from "@/lib/utils/export";

export default function VillageLevelReport() {
  const [data, setData] = useState<VillageLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getVillageLevelReport();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load village level data");
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
    const filename = `village_level_report_${timestamp}`;
    
    // Prepare export data
    const exportDataObj = {
      report_type: 'Village Level Report',
      generated_at: new Date().toISOString(),
      villages: data.villages
    };
    
    exportData({ filename, format, data: exportDataObj });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading village level data...</div>
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

  // Group villages by zone
  const villagesByZone = new Map<string, typeof data.villages>();
  data.villages.forEach(village => {
    const zoneName = village.zone_name;
    if (!villagesByZone.has(zoneName)) {
      villagesByZone.set(zoneName, []);
    }
    villagesByZone.get(zoneName)!.push(village);
  });

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Village Level Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detailed statistics and support levels for each village
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Villages</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_villages}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-4 text-green-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Households</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_households.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-purple-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Voters</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_eligible_voters.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="size-4 text-orange-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Overall Support</p>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(data.summary.overall_support_score)}`}>
            {data.summary.overall_support_score}%
          </p>
        </div>
      </div>

      {/* Villages by Zone */}
      {Array.from(villagesByZone.entries()).map(([zoneName, villages]) => (
        <div key={zoneName} className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="size-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {zoneName} Zone
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({villages.length} {villages.length === 1 ? "village" : "villages"})
            </span>
          </div>

          <div className="space-y-3">
            {villages
              .sort((a, b) => b.support_score - a.support_score)
              .map((village) => (
                <div
                  key={village.village_id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {village.village_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {village.total_households} households • {village.total_eligible_voters} eligible voters
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(village.support_score)}`}>
                        {village.support_score}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Support Score</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Support Score</span>
                        <span className="font-medium">{village.support_score}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreBgColor(village.support_score)}`}
                          style={{ width: `${village.support_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-3 h-3 bg-white border border-gray-400 rounded"></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">White</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {village.white_supporters}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {village.total_eligible_voters > 0
                          ? ((village.white_supporters / village.total_eligible_voters) * 100).toFixed(1)
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
                        {village.black_non_supporters}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {village.total_eligible_voters > 0
                          ? ((village.black_non_supporters / village.total_eligible_voters) * 100).toFixed(1)
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
                        {village.red_undetermined}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {village.total_eligible_voters > 0
                          ? ((village.red_undetermined / village.total_eligible_voters) * 100).toFixed(1)
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
                        {village.unclassified}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {village.total_eligible_voters > 0
                          ? ((village.unclassified / village.total_eligible_voters) * 100).toFixed(1)
                          : "0"}
                        %
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="size-3 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Aid</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {village.aid_distributions}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">distributions</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {data.villages.length === 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Home className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No villages found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Villages are matched to households based on the area field
          </p>
        </div>
      )}
    </div>
  );
}
