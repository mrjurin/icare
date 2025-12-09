import Link from "next/link";
import {
  Users,
  BookOpen,
  Globe,
  MapPin,
  Building2,
  Vote,
  School,
  Landmark,
  AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReferenceTable } from "@/lib/actions/reference-data";
import { getTableDisplayName } from "@/lib/utils/reference-data";

const referenceTables: Array<{ table: ReferenceTable; icon: typeof Users }> = [
  { table: "genders", icon: Users },
  { table: "religions", icon: BookOpen },
  { table: "races", icon: Globe },
  { table: "districts", icon: MapPin },
  { table: "parliaments", icon: Landmark },
  { table: "duns", icon: Building2 },
  { table: "zones", icon: MapPin },
  { table: "cawangan", icon: Building2 },
  { table: "villages", icon: Building2 },
  { table: "localities", icon: Vote },
  { table: "polling_stations", icon: School },
];

export default function ReferenceDataIndexPage() {
  const t = useTranslations("referenceData");
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {referenceTables.map(({ table, icon: Icon }) => {
          const displayName = getTableDisplayName(table, t);
          return (
            <Link
              key={table}
              href={`/admin/reference-data/${table}`}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("manageData", { displayName: displayName.toLowerCase() })}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
        <Link
          href="/admin/issue-types"
          className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <AlertTriangle className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Issue Types
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage issue types for community reporting
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
