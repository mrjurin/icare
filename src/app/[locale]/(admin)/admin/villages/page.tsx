import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { getVillages } from "@/lib/actions/villages";
import VillageTable from "./VillageTable";
import VillageFormModal from "./VillageFormModal";
import { getTranslations } from "next-intl/server";

export default async function AdminVillagesPage() {
  const t = await getTranslations("villages");
  const result = await getVillages();
  const villages = result.success ? result.data || [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
          <p className="text-gray-600 mt-1">{t("description")}</p>
        </div>
        <div className="flex gap-3">
          <VillageFormModal
            trigger={
              <Button className="gap-2">
                <Plus className="size-5" />
                <span>{t("addVillage")}</span>
              </Button>
            }
          />
        </div>
      </div>

      <VillageTable villages={villages} />
    </div>
  );
}
