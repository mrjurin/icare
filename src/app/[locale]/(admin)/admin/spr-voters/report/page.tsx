import SprVoterReport from "../SprVoterReport";
import SprVoterDemographicReport from "../SprVoterDemographicReport";
import { getVoterVersions } from "@/lib/actions/spr-voters";
import ReportTabs from "./ReportTabs";
import { getTranslations } from "next-intl/server";

export default async function SprVoterReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("sprVoterReports");
  const sp = await searchParams;
  const versionId = typeof sp.versionId === "string" ? parseInt(sp.versionId, 10) : undefined;
  const reportType = typeof sp.type === "string" ? sp.type : "support";

  // Get versions
  const versionsResult = await getVoterVersions();
  const versions = versionsResult.success ? versionsResult.data || [] : [];

  // Get active version if no versionId specified
  const activeVersion = versions.find((v) => v.is_active);
  const selectedVersionId = versionId || activeVersion?.id;

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
      </div>

      <ReportTabs activeTab={reportType} versionId={selectedVersionId} />

      {reportType === "support" && (
        <SprVoterReport versions={versions} initialVersionId={selectedVersionId} />
      )}
      {reportType === "demographic" && (
        <SprVoterDemographicReport versions={versions} initialVersionId={selectedVersionId} />
      )}
    </div>
  );
}
