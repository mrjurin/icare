import { getAidsPrograms } from "@/lib/actions/aidsPrograms";
import AidsProgramsTable from "./AidsProgramsTable";
import NewAidsProgramButton from "./NewAidsProgramButton";
import AidsProgramFormModal from "./AidsProgramFormModal";
import { getTranslations } from "next-intl/server";

export default async function AdminAidsProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("aidsPrograms");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const result = await getAidsPrograms({ status });

  const programs = result.success ? result.data || [] : [];

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
        <NewAidsProgramButton />
      </div>

      <AidsProgramsTable programs={programs} />
      <AidsProgramFormModal />
    </div>
  );
}
