import { Plus, Users, Home, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getHouseholdList, getHouseholdsWithoutRecentAid } from "@/lib/actions/households";
import { getZones } from "@/lib/actions/zones";
import { getAllAidsProgramsForFilter } from "@/lib/actions/aidsPrograms";
import HouseholdFormModal from "./HouseholdFormModal";
import HouseholdTable from "./HouseholdTable";
import HouseholdFilters from "./HouseholdFilters";
import { getTranslations } from "next-intl/server";

export default async function AdminHouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("households");
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const area = typeof sp.area === "string" ? sp.area : undefined;
  const aidProgramId = typeof sp.aidProgram === "string" ? parseInt(sp.aidProgram, 10) : undefined;
  const year = typeof sp.year === "string" ? parseInt(sp.year, 10) : undefined;

  const result = await getHouseholdList({ 
    search, 
    area, 
    aidProgramId: isNaN(aidProgramId || 0) ? undefined : aidProgramId,
    year: isNaN(year || 0) ? undefined : year,
  });
  const households = result.success ? result.data || [] : [];

  // Get zones for filter dropdown
  const zonesResult = await getZones();
  const zones = zonesResult.success ? zonesResult.data || [] : [];

  // Get aid programs for filter dropdown
  const aidsProgramsResult = await getAllAidsProgramsForFilter();
  const aidsPrograms = aidsProgramsResult.success ? aidsProgramsResult.data || [] : [];

  // Extract unique years from aid programs
  const years = new Set<number>();
  aidsPrograms.forEach((program) => {
    const dateToCheck = program.start_date || program.created_at;
    if (dateToCheck) {
      const programYear = new Date(dateToCheck).getFullYear();
      years.add(programYear);
    }
  });
  const sortedYears = Array.from(years).sort((a, b) => b - a); // Most recent first

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
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("description")}
          </p>
        </div>
        <HouseholdFormModal
          trigger={
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>{t("addHousehold")}</span>
            </Button>
          }
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="size-5 text-primary" />
            <p className="text-sm text-gray-600">{t("statistics.totalHouseholds")}</p>
          </div>
          <p className="text-3xl font-bold">{totalHouseholds}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">{t("statistics.totalMembers")}</p>
          </div>
          <p className="text-3xl font-bold">{totalMembers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">{t("statistics.membersAtHome")}</p>
          </div>
          <p className="text-3xl font-bold">{totalAtHome}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="size-5 text-orange-600" />
            <p className="text-sm text-gray-600">{t("statistics.totalDependents")}</p>
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
                {t("alert.title", { count: householdsWithoutAid.length })}
              </h3>
              <p className="text-sm text-orange-800">
                {t("alert.description")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <HouseholdFilters
        zones={zones}
        aidsPrograms={aidsPrograms}
        years={sortedYears}
        searchPlaceholder={t("filters.searchPlaceholder")}
        allZonesLabel={t("filters.allZones")}
        allAidProgramsLabel={t("filters.allAidPrograms")}
        allYearsLabel={t("filters.allYears")}
        resetFiltersLabel={t("filters.resetFilters")}
      />

      {/* Households Table */}
      <HouseholdTable households={households} />
    </div>
  );
}
