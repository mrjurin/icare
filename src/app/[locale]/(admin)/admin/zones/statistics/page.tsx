import { MapPin, Users, Baby, Vote, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getZoneStatistics } from "@/lib/actions/zones";

export default async function ZoneStatisticsPage() {
  const result = await getZoneStatistics();
  const statistics = result.success ? result.data || [] : [];

  const totalPeople = statistics.reduce((sum, stat) => sum + stat.total_people, 0);
  const totalChildren = statistics.reduce((sum, stat) => sum + stat.total_children, 0);
  const totalEligibleVoters = statistics.reduce((sum, stat) => sum + stat.total_eligible_voters, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Zone Statistics</h1>
          <p className="text-gray-600 mt-1">
            View demographic statistics and voting eligibility by zone
          </p>
        </div>
        <Link href="/zones">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            <span>Back to Zones</span>
          </Button>
        </Link>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total People</p>
          </div>
          <p className="text-3xl font-bold">{totalPeople}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Baby className="size-5 text-orange-600" />
            <p className="text-sm text-gray-600">Total Children (&lt;18)</p>
          </div>
          <p className="text-3xl font-bold">{totalChildren}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Vote className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">Eligible Voters (18+)</p>
          </div>
          <p className="text-3xl font-bold">{totalEligibleVoters}</p>
        </div>
      </div>

      {/* Zone Statistics */}
      {statistics.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <MapPin className="size-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No zone statistics available</h3>
          <p className="text-gray-600">Create zones and assign households to see statistics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statistics.map((stat) => (
            <div key={stat.zone_id} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="size-5 text-primary" />
                <h2 className="text-xl font-bold text-gray-900">{stat.zone_name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600 mb-1">Total People</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.total_people}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-orange-50 p-4">
                  <p className="text-sm text-gray-600 mb-1">Children (&lt;18)</p>
                  <p className="text-2xl font-bold text-orange-700">{stat.total_children}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-green-50 p-4">
                  <p className="text-sm text-gray-600 mb-1">Eligible Voters (18+)</p>
                  <p className="text-2xl font-bold text-green-700">{stat.total_eligible_voters}</p>
                </div>
              </div>

              {/* Locality Breakdown */}
              {stat.locality_breakdown.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Voting Locality Breakdown</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Locality
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                            Eligible Voters
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stat.locality_breakdown.map((item, index) => (
                          <tr
                            key={index}
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="px-4 py-3 text-gray-900">{item.locality}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
                  No locality data available for eligible voters in this zone
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
