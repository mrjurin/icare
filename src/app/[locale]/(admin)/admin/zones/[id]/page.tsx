import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import { getZoneById } from "@/lib/actions/zones";
import { getVillages } from "@/lib/actions/villages";
import VillageTable from "../../villages/VillageTable";
import AddVillageToZoneModal from "./AddVillageToZoneModal";
import PollingStationLinkSection from "./PollingStationLinkSection";
import { getTranslations } from "next-intl/server";

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("zones.detail");
  const { id } = await params;
  const zoneId = parseInt(id, 10);

  if (isNaN(zoneId)) {
    notFound();
  }

  const zoneResult = await getZoneById(zoneId);
  if (!zoneResult.success || !zoneResult.data) {
    notFound();
  }

  const zone = zoneResult.data;

  const villagesResult = await getVillages(zoneId);
  const villages = villagesResult.success ? villagesResult.data || [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/zones">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              <span>{t("backToZones")}</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{zone.name}</h1>
            <p className="text-gray-600 mt-1">
              {zone.description || t("zoneDetailsAndVillageManagement")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">{t("zoneName")}</div>
            <div className="text-lg font-semibold text-gray-900">{zone.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">{t("totalVillages")}</div>
            <div className="text-lg font-semibold text-gray-900">{villages.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">{t("created")}</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date(zone.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          </div>
        </div>
        {zone.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t("description")}</div>
            <div className="text-gray-900">{zone.description}</div>
          </div>
        )}
      </div>

      <PollingStationLinkSection zone={zone} zoneId={zoneId} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("villagesInZone", { zoneName: zone.name })}</h2>
            <p className="text-gray-600 text-sm mt-1">
              {t("manageVillagesAssigned")}
            </p>
          </div>
          <AddVillageToZoneModal
            zoneId={zoneId}
            zoneName={zone.name}
            trigger={
              <Button className="gap-2">
                <Plus className="size-5" />
                <span>{t("addVillage")}</span>
              </Button>
            }
          />
        </div>

        <VillageTable villages={villages} />
      </div>
    </div>
  );
}
