import { getActiveAnnouncementsPaginated } from "@/lib/actions/announcements";
import { getTranslations } from "next-intl/server";
import PublicAnnouncementsList from "@/components/PublicAnnouncementsList";
import PublicHeaderClient from "@/components/PublicHeaderClient";
import { getSetting } from "@/lib/actions/settings";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("announcements");
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 12;
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const appNameResult = await getSetting("app_name");
  const appName = appNameResult.success && appNameResult.data 
    ? appNameResult.data 
    : "N.18 Inanam Platform";

  const result = await getActiveAnnouncementsPaginated({
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 12 : limit,
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
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeaderClient appName={appName} />
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-[-0.015em] text-gray-900 dark:text-white mb-2">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <PublicAnnouncementsList announcements={announcements} pagination={pagination} />
      </main>
    </div>
  );
}
