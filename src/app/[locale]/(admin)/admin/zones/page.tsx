import { Plus, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { getZonesReadOnly } from "@/lib/actions/zones";
import { getVillageCountsByZoneReadOnly } from "@/lib/actions/villages";
import ZoneTable from "./ZoneTable";
import ZoneFormModal from "./ZoneFormModal";
import { getTranslations } from "next-intl/server";

export default async function AdminZonesPage() {
  const t = await getTranslations("zones");
  const zonesResult = await getZonesReadOnly();
  const zones = zonesResult.success ? zonesResult.data || [] : [];

  const zoneIds = zones.map((z) => z.id);
  const villageCountsResult = await getVillageCountsByZoneReadOnly(zoneIds);
  const villageCounts = villageCountsResult.success ? villageCountsResult.data || {} : {};

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>
          <p className="text-gray-600 mt-1">{t("description")}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/zones/statistics">
            <Button variant="outline" className="gap-2">
              <MapPin className="size-5" />
              <span>{t("viewStatistics")}</span>
            </Button>
          </Link>
          <ZoneFormModal
            trigger={
              <Button className="gap-2">
                <Plus className="size-5" />
                <span>{t("addZone")}</span>
              </Button>
            }
          />
        </div>
      </div>

      <ZoneTable zones={zones} villageCounts={villageCounts} />
    </div>
  );
}
