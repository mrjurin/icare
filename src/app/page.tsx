import { getSetting, getDunName } from "@/lib/actions/settings";
import { getActiveAnnouncements, getActiveAnnouncementsPaginated } from "@/lib/actions/announcements";
import HomeClient from "./HomeClient";

export default async function Home() {
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
