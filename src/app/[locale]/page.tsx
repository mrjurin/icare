import { getSetting, getDunName } from "@/lib/actions/settings";
import { getActiveAnnouncements, getActiveAnnouncementsPaginated } from "@/lib/actions/announcements";
import { getDynamicPageData, formatBlocksForRenderer } from "@/lib/utils/dynamic-pages";
import { getLocale } from "next-intl/server";
import HomeClient from "../../app/HomeClient";
import DynamicPageRenderer from "@/components/DynamicPageRenderer";

export default async function Home() {
  const locale = await getLocale();
  
  // Try to get page builder version first
  try {
    const pageData = await getDynamicPageData(`/${locale}`, locale);
    const formattedBlocks = formatBlocksForRenderer(pageData.blocks, locale);
    
    // Get app name and announcements for page builder version
    const [appNameResult, announcementsResult] = await Promise.all([
      getSetting("app_name"),
      getActiveAnnouncements(3)
    ]);
    
    const appName = appNameResult.success && appNameResult.data 
      ? appNameResult.data 
      : "Community Watch";
      
    const announcements = announcementsResult.success && announcementsResult.data
      ? announcementsResult.data
      : [];

    return (
      <DynamicPageRenderer
        pageTitle={pageData.page.title || pageData.page.name}
        pageDescription={pageData.page.description || undefined}
        blocks={formattedBlocks}
        locale={locale}
        appName={appName}
        announcements={announcements}
      />
    );
  } catch (error) {
    // Fall back to original implementation if page builder version doesn't exist
    console.log("Page builder version not found, using original landing page");
    
    const [appNameResult, dunName] = await Promise.all([
      getSetting("app_name"),
      getDunName(),
    ]);
    const appName = appNameResult.success && appNameResult.data 
      ? appNameResult.data 
      : `${dunName} Platform`;

    // Fetch active announcements (limit to 3 for landing page - most recent)
    const announcementsResult = await getActiveAnnouncements(3);
    const announcements = announcementsResult.success && announcementsResult.data
      ? announcementsResult.data
      : [];

    // Get total count for "View All" button
    const totalResult = await getActiveAnnouncementsPaginated({ page: 1, limit: 1 });
    const totalCount = totalResult.success && totalResult.data ? totalResult.data.total : 0;

    return <HomeClient appName={appName} announcements={announcements} totalAnnouncements={totalCount} dunName={dunName} />;
  }
}
