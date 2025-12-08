import { getVotersList, getVoterVersions } from "@/lib/actions/spr-voters";
import SprVotersTable from "./SprVotersTable";
import VersionManagement from "./VersionManagement";
import ImportExportSection from "./ImportExportSection";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import Button from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";

export default async function AdminSprVotersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("sprVoters");
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 50;
  const versionId = typeof sp.versionId === "string" ? parseInt(sp.versionId, 10) : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const unmatchedOnly = typeof sp.unmatchedOnly === "string" ? sp.unmatchedOnly === "true" : false;

  // Get versions
  const versionsResult = await getVoterVersions();
  const versions = versionsResult.success ? versionsResult.data || [] : [];

  // Get active version if no versionId specified
  const activeVersion = versions.find((v) => v.is_active);
  const selectedVersionId = versionId || activeVersion?.id;

  // Get voters
  const result = await getVotersList({
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 50 : limit,
    versionId: selectedVersionId,
    search,
    unmatchedOnly,
  });

  const paginatedData = result.success ? result.data : null;
  const voters = paginatedData?.data || [];
  const pagination = paginatedData
    ? {
        currentPage: paginatedData.page,
        totalPages: paginatedData.totalPages,
        totalItems: paginatedData.total,
        itemsPerPage: paginatedData.limit,
      }
    : null;

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
        {selectedVersionId && (
          <Link href={`/admin/spr-voters/report?versionId=${selectedVersionId}`}>
            <Button className="gap-2">
              <BarChart3 className="size-4" />
              {t("viewReport")}
            </Button>
          </Link>
        )}
      </div>

      <VersionManagement versions={versions} selectedVersionId={selectedVersionId} />

      {selectedVersionId && (
        <>
          <ImportExportSection versionId={selectedVersionId} />
          <SprVotersTable
            voters={voters}
            pagination={pagination}
            versionId={selectedVersionId}
            search={search}
            unmatchedOnly={unmatchedOnly}
          />
        </>
      )}

      {!selectedVersionId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {t("noVersionSelected")}
          </p>
        </div>
      )}
    </div>
  );
}
