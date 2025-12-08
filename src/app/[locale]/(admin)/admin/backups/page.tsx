import { getTranslations } from "next-intl/server";
import { getBackupsList } from "@/lib/actions/backups";
import BackupsTable from "./BackupsTable";
import CreateBackupButton from "./CreateBackupButton";
import { getCurrentUserAccessReadOnly } from "@/lib/utils/accessControl";
import { redirect } from "next/navigation";

export default async function BackupsPage() {
  const t = await getTranslations("backups");
  const access = await getCurrentUserAccessReadOnly();

  // Only super_admin and ADUN can access backups
  if (!access.isAuthenticated || (!access.isSuperAdmin && !access.isAdun)) {
    redirect("/admin/dashboard");
  }

  const result = await getBackupsList();
  const backups = result.success ? result.data || [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t("description")}</p>
        </div>
        <CreateBackupButton />
      </div>

      <BackupsTable backups={backups} />
    </div>
  );
}
