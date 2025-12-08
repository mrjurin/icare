import { getReferenceDataList, type ReferenceTable } from "@/lib/actions/reference-data";
import { getTableDisplayName } from "@/lib/utils/reference-data";
import ReferenceDataTable from "../ReferenceDataTable";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const validTables: ReferenceTable[] = [
  "genders",
  "religions",
  "races",
  "districts",
  "parliaments",
  "localities",
  "polling_stations",
  "duns",
];

export default async function ReferenceDataPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const t = await getTranslations("referenceData");
  
  if (!validTables.includes(table as ReferenceTable)) {
    notFound();
  }

  const tableName = table as ReferenceTable;
  const result = await getReferenceDataList(tableName);

  const data = result.success ? result.data || [] : [];
  const displayName = getTableDisplayName(tableName, t);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            {t("management", { displayName })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("manageDescription", { displayName: displayName.toLowerCase() })}
          </p>
        </div>
      </div>

      <ReferenceDataTable table={tableName} data={data} />
    </div>
  );
}
