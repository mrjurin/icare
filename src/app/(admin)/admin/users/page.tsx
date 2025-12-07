import { getCommunityUsers } from "@/lib/actions/communityUsers";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const statusFilter = typeof sp.status === "string" ? (sp.status as "pending" | "verified" | "rejected") : undefined;
  const zoneFilter = typeof sp.zone === "string" ? parseInt(sp.zone, 10) : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 10;

  const result = await getCommunityUsers({
    search,
    status: statusFilter,
    zoneId: zoneFilter && !isNaN(zoneFilter) ? zoneFilter : undefined,
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 10 : limit,
  });

  const paginatedData = result.success ? result.data : null;
  const usersList = paginatedData?.data || [];
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
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Community Users</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and verify community user registrations. Users register first and zone leaders verify their information.
          </p>
        </div>
      </div>

      {!result.success && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error loading users: {result.error || "Unknown error"}
          </p>
        </div>
      )}

      <UsersTable users={usersList} pagination={pagination} />
    </div>
  );
}
