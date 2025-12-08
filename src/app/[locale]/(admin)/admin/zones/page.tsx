import { Plus, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { getZones } from "@/lib/actions/zones";
import { getVillageCountsByZone } from "@/lib/actions/villages";
import ZoneTable from "./ZoneTable";
import ZoneFormModal from "./ZoneFormModal";

export default async function AdminZonesPage() {
  const zonesResult = await getZones();
  const zones = zonesResult.success ? zonesResult.data || [] : [];

  const zoneIds = zones.map((z) => z.id);
  const villageCountsResult = await getVillageCountsByZone(zoneIds);
  const villageCounts = villageCountsResult.success ? villageCountsResult.data || {} : {};

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Zone Management</h1>
          <p className="text-gray-600 mt-1">Manage zones for organizing households and aid distribution</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/zones/statistics">
            <Button variant="outline" className="gap-2">
              <MapPin className="size-5" />
              <span>View Statistics</span>
            </Button>
          </Link>
          <ZoneFormModal
            trigger={
              <Button className="gap-2">
                <Plus className="size-5" />
                <span>Add Zone</span>
              </Button>
            }
          />
        </div>
      </div>

      <ZoneTable zones={zones} villageCounts={villageCounts} />
    </div>
  );
}
