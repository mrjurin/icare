import { Plus, Search, Users, Home, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getHouseholdList, getHouseholdsWithoutRecentAid } from "@/lib/actions/households";
import { getZones } from "@/lib/actions/zones";
import HouseholdFormModal from "./HouseholdFormModal";
import HouseholdTable from "./HouseholdTable";

export default async function AdminHouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const area = typeof sp.area === "string" ? sp.area : undefined;

  const result = await getHouseholdList({ search, area });
  const households = result.success ? result.data || [] : [];

  // Get zones for filter dropdown
  const zonesResult = await getZones();
  const zones = zonesResult.success ? zonesResult.data || [] : [];

  // Get households without recent aid
  const householdsWithoutAidResult = await getHouseholdsWithoutRecentAid(30, area);
  const householdsWithoutAid = householdsWithoutAidResult.success
    ? householdsWithoutAidResult.data || []
    : [];

  // Calculate statistics
  const totalHouseholds = households.length;
  const totalMembers = households.reduce((sum, h) => sum + (h.total_members || 0), 0);
  const totalAtHome = households.reduce((sum, h) => sum + (h.members_at_home || 0), 0);
  const totalDependents = households.reduce((sum, h) => sum + (h.total_dependents || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Household Management</h1>
          <p className="text-gray-600 mt-1">
            Manage households, members, income, and track aid distribution to ensure no one is left behind
          </p>
        </div>
        <HouseholdFormModal
          trigger={
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>Add Household</span>
            </Button>
          }
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="size-5 text-primary" />
            <p className="text-sm text-gray-600">Total Households</p>
          </div>
          <p className="text-3xl font-bold">{totalHouseholds}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <p className="text-3xl font-bold">{totalMembers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">Members at Home</p>
          </div>
          <p className="text-3xl font-bold">{totalAtHome}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-orange-600" />
            <p className="text-sm text-gray-600">Total Dependents</p>
          </div>
          <p className="text-3xl font-bold">{totalDependents}</p>
        </div>
      </div>

      {/* Alert for households without recent aid */}
      {householdsWithoutAid.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                {householdsWithoutAid.length} Household{householdsWithoutAid.length !== 1 ? "s" : ""} Without Recent Aid
              </h3>
              <p className="text-sm text-orange-800">
                These households haven't received aid in the last 30 days. Make sure to include them in the next distribution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <form method="get" action="/admin/households" className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
                <Input
                  name="search"
                  placeholder="Search by name, address, or area..."
                  defaultValue={search}
                  className="pl-9 w-full"
                />
              </div>
              <select
                name="area"
                className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900"
                defaultValue={area || ""}
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.name}>
                    {zone.name}
                  </option>
                ))}
              </select>
              {(search || area) && (
                <Link href="/admin/households">
                  <Button type="button" variant="outline">Reset Filters</Button>
                </Link>
              )}
              <button type="submit" className="sr-only">Search</button>
            </form>
          </div>
        </div>
        <div className="h-px bg-gray-200" />
      </div>

      {/* Households Table */}
      <HouseholdTable households={households} />
    </div>
  );
}
