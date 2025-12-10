import { getAidsPrograms } from "@/lib/actions/aidsPrograms";
import AidsProgramsTable from "./AidsProgramsTable";
import NewAidsProgramButton from "./NewAidsProgramButton";
import AidsProgramFormModal from "./AidsProgramFormModal";
import { getTranslations } from "next-intl/server";

export default async function AdminAidsProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("aidsPrograms");
  const sp = await searchParams;
  
  // Parse search params
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const zoneId = typeof sp.zone === "string" ? parseInt(sp.zone, 10) : undefined;
  const year = typeof sp.year === "string" ? parseInt(sp.year, 10) : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) || 1 : 1;
  const limit = 10;

  // Fetch programs with filters and pagination
  const result = await getAidsPrograms({
    status,
    zoneId: isNaN(zoneId || 0) ? undefined : zoneId,
    year: isNaN(year || 0) ? undefined : year,
    search,
    page,
    limit,
  });

  const data = result.success && result.data ? result.data : {
    programs: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("description")}
          </p>
        </div>
        <NewAidsProgramButton />
      </div>

      <AidsProgramsTable
        programs={data.programs}
        pagination={{
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.total,
          itemsPerPage: data.limit,
        }}
        initialFilters={{
          status: status || "",
          year: year?.toString() || "",
          search: search || "",
        }}
      />
      <AidsProgramFormModal />
    </div>
  );
}
