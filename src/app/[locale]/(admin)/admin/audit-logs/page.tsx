import { getAuditLogs, getAuditLogFilterOptions } from "@/lib/actions/audit-logs";
import AuditLogsTable from "./AuditLogsTable";
import AuditLogsTabs from "./AuditLogsTabs";
import { getTranslations } from "next-intl/server";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auditLogs");
  const sp = await searchParams;

  const search = typeof sp.search === "string" ? sp.search : undefined;
  const eventType = typeof sp.eventType === "string" ? sp.eventType : undefined;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : undefined;
  const userId = typeof sp.userId === "string" ? parseInt(sp.userId, 10) : undefined;
  const success = typeof sp.success === "string" ? (sp.success === "true" ? true : sp.success === "false" ? false : undefined) : undefined;
  const startDate = typeof sp.startDate === "string" ? sp.startDate : undefined;
  const endDate = typeof sp.endDate === "string" ? sp.endDate : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 50;

  const [logsResult, filterOptionsResult] = await Promise.all([
    getAuditLogs({
      search,
      eventType,
      entityType,
      userId: isNaN(userId || 0) ? undefined : userId,
      success,
      startDate,
      endDate,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 50 : limit,
    }),
    getAuditLogFilterOptions(),
  ]);

  const paginatedData = logsResult.success ? logsResult.data : null;
  const auditLogs = paginatedData?.data || [];

  const pagination = paginatedData
    ? {
      currentPage: paginatedData.page,
      totalPages: paginatedData.totalPages,
      totalItems: paginatedData.total,
      itemsPerPage: 50, // default limit
    }
    : null;

  const filterOptions = filterOptionsResult.success && filterOptionsResult.data ? filterOptionsResult.data : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t("description")}</p>
      </div>

      <AuditLogsTabs />

      <AuditLogsTable
        auditLogs={auditLogs}
        pagination={pagination}
        filterOptions={filterOptions}
        initialFilters={{
          search,
          eventType,
          entityType,
          userId,
          success,
          startDate,
          endDate,
        }}
      />
    </div>
  );
}
