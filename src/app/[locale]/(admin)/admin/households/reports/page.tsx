import { getHouseholdList } from "@/lib/actions/households";
import { getZones } from "@/lib/actions/zones";
import { getTranslations } from "next-intl/server";
import { Home, Users, TrendingUp, AlertCircle } from "lucide-react";

export default async function HouseholdReportsPage() {
  const t = await getTranslations("households");
  const tNav = await getTranslations("nav");

  // Get all households for statistics
  const householdsResult = await getHouseholdList();
  const households = householdsResult.success ? householdsResult.data || [] : [];

  // Get zones for zone-based statistics
  const zonesResult = await getZones();
  const zones = zonesResult.success ? zonesResult.data || [] : [];

  // Calculate statistics
  const totalHouseholds = households.length;
  const totalMembers = households.reduce((sum, h) => sum + (h.total_members || 0), 0);
  const totalDependents = households.reduce((sum, h) => sum + (h.total_dependents || 0), 0);
  const householdsWithIncome = households.filter(h => h.latest_income && h.latest_income > 0).length;
  const averageMembersPerHousehold = totalHouseholds > 0 ? (totalMembers / totalHouseholds).toFixed(1) : "0";

  // Zone-based statistics
  const zoneStats = zones.map(zone => {
    const zoneHouseholds = households.filter(h => (h as any).zone_id === zone.id);
    return {
      zoneName: zone.name,
      totalHouseholds: zoneHouseholds.length,
      totalMembers: zoneHouseholds.reduce((sum, h) => sum + (h.total_members || 0), 0),
      totalDependents: zoneHouseholds.reduce((sum, h) => sum + (h.total_dependents || 0), 0),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
          {tNav("householdReports")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Comprehensive household statistics and analytics
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Households</p>
              <p className="text-2xl font-bold mt-1">{totalHouseholds.toLocaleString()}</p>
            </div>
            <Home className="size-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold mt-1">{totalMembers.toLocaleString()}</p>
            </div>
            <Users className="size-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Dependents</p>
              <p className="text-2xl font-bold mt-1">{totalDependents.toLocaleString()}</p>
            </div>
            <AlertCircle className="size-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Members/Household</p>
              <p className="text-2xl font-bold mt-1">{averageMembersPerHousehold}</p>
            </div>
            <TrendingUp className="size-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Zone Statistics */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Statistics by Zone</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold">Zone</th>
                <th className="text-right py-3 px-4 font-semibold">Households</th>
                <th className="text-right py-3 px-4 font-semibold">Members</th>
                <th className="text-right py-3 px-4 font-semibold">Dependents</th>
              </tr>
            </thead>
            <tbody>
              {zoneStats.map((stat, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">{stat.zoneName}</td>
                  <td className="text-right py-3 px-4">{stat.totalHouseholds.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{stat.totalMembers.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{stat.totalDependents.toLocaleString()}</td>
                </tr>
              ))}
              {zoneStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No zone data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Households with Income Data</p>
            <p className="text-lg font-semibold mt-1">{householdsWithIncome.toLocaleString()} / {totalHouseholds.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Households without Income Data</p>
            <p className="text-lg font-semibold mt-1">{(totalHouseholds - householdsWithIncome).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
