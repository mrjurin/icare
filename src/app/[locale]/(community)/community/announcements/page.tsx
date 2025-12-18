import { getActiveAnnouncementsPaginated } from "@/lib/actions/announcements";
import { getTranslations } from "next-intl/server";
import PublicAnnouncementsList from "@/components/PublicAnnouncementsList";
import { redirect } from "next/navigation";
import { getAuthenticatedUserReadOnly } from "@/lib/supabase/server";

export default async function CommunityAnnouncementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations("announcements");
  
  // Check authentication
  const user = await getAuthenticatedUserReadOnly();
  if (!user) {
    redirect(`/${locale}/community/login`);
  }

  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : 12;
  const category = typeof sp.category === "string" ? sp.category : undefined;

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <PublicAnnouncementsList announcements={announcements} pagination={pagination} />
    </div>
  );
}
