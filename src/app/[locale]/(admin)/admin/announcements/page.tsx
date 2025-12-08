import { getAnnouncementsList } from "@/lib/actions/announcements";
import AnnouncementsTable from "./AnnouncementsTable";
import NewAnnouncementButton from "./NewAnnouncementButton";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 10;
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const result = await getAnnouncementsList({
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 10 : limit,
    category,
  });

  const paginatedData = result.success ? result.data : null;
  const announcements = paginatedData?.data || [];
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
            Public Announcement Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage announcements for the community
          </p>
        </div>
        <NewAnnouncementButton />
      </div>

      <AnnouncementsTable announcements={announcements} pagination={pagination} />
    </div>
  );
}
