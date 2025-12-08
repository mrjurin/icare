"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import { assignProgramToKetuaCawangan, getProgramAssignments } from "@/lib/actions/aidsPrograms";
import { getRoleAssignments } from "@/lib/actions/roles";
import { AidsProgramZone } from "@/lib/actions/aidsPrograms";
import { useTranslations } from "next-intl";

type AssignKetuaCawanganSectionProps = {
  programId: number;
  zones: AidsProgramZone[];
};

export default function AssignKetuaCawanganSection({
  programId,
  zones,
}: AssignKetuaCawanganSectionProps) {
  const t = useTranslations("aidsPrograms.assign");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [ketuaCawanganList, setKetuaCawanganList] = useState<
    Array<{ id: number; name: string; staff_id: number }>
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedZoneId) {
      const loadKetuaCawangan = async () => {
        const result = await getRoleAssignments({ zoneId: selectedZoneId, status: "active" });
        if (result.success && result.data) {
          // Get all role assignments - any role can be assigned as ketua cawangan
          const ketuaCawangan = result.data.map((ra) => ({
            id: ra.id,
            name: ra.staff_name || "Unknown",
            staff_id: ra.staff_id,
          }));
          setKetuaCawanganList(ketuaCawangan);
        }
      };
      loadKetuaCawangan();
    }
  }, [selectedZoneId]);

  const handleAssign = async () => {
    if (!selectedZoneId || !selectedStaffId) {
      alert(t("selectZoneAndChief"));
      return;
    }

    startTransition(async () => {
      const result = await assignProgramToKetuaCawangan({
        programId,
        zoneId: selectedZoneId,
        staffId: selectedStaffId,
        notes: notes || undefined,
      });

      if (result.success) {
        alert(t("assignSuccess"));
        setSelectedZoneId(null);
        setSelectedStaffId(null);
        setNotes("");
        router.refresh();
      } else {
        alert(result.error || t("assignError"));
      }
    });
  };

  const uniqueZoneIds = [...new Set(zones.map((z) => z.zone_id).filter((id): id is number => id !== null))];

  if (uniqueZoneIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">{t("title")}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("selectZone")}
          </label>
          <select
            value={selectedZoneId || ""}
            onChange={(e) => {
              setSelectedZoneId(e.target.value ? parseInt(e.target.value, 10) : null);
              setSelectedStaffId(null);
            }}
            className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">{t("selectZonePlaceholder")}</option>
            {uniqueZoneIds.map((zoneId) => {
              const zone = zones.find((z) => z.zone_id === zoneId);
              return (
                <option key={zoneId} value={zoneId}>
                  {zone?.zone_name || `Zone ${zoneId}`}
                </option>
              );
            })}
          </select>
        </div>

        {selectedZoneId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("selectBranchChief")}
            </label>
            <select
              value={selectedStaffId || ""}
              onChange={(e) =>
                setSelectedStaffId(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            >
              <option value="">{t("selectBranchChiefPlaceholder")}</option>
              {ketuaCawanganList.map((kc) => (
                <option key={kc.id} value={kc.staff_id}>
                  {kc.name}
                </option>
              ))}
            </select>
            {ketuaCawanganList.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("noBranchChief")}
              </p>
            )}
          </div>
        )}

        {selectedZoneId && selectedStaffId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              placeholder={t("notesPlaceholder")}
            />
          </div>
        )}

        <Button
          onClick={handleAssign}
          disabled={!selectedZoneId || !selectedStaffId || isPending}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {isPending ? t("assigning") : t("assignProgram")}
        </Button>
      </div>
    </div>
  );
}
