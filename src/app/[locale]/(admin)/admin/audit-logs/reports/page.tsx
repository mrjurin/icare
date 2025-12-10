import { getAuditLogStats } from "@/lib/actions/audit-logs";
import AuditReports from "./AuditReports";
import AuditLogsTabs from "../AuditLogsTabs";
import { getTranslations } from "next-intl/server";

export default async function AdminAuditReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auditLogs.reports");
  const sp = await searchParams;

  const startDate = typeof sp.startDate === "string" ? sp.startDate : undefined;
  const endDate = typeof sp.endDate === "string" ? sp.endDate : undefined;

  const statsResult = await getAuditLogStats(startDate, endDate);
  const stats = statsResult.success && statsResult.data ? statsResult.data : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t("description")}</p>
      </div>

      <AuditLogsTabs />

      <AuditReports stats={stats} initialFilters={{ startDate, endDate }} />
    </div>
  );
}
