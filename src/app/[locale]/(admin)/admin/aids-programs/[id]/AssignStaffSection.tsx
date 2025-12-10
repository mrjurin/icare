"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { updateAidsProgram, type AidsProgram } from "@/lib/actions/aidsPrograms";
import { getActiveStaff } from "@/lib/actions/staff";
import { useTranslations } from "next-intl";

type AssignStaffSectionProps = {
  program: AidsProgram;
  assignedStaffIds: number[];
};

export default function AssignStaffSection({ program, assignedStaffIds: initialAssignedStaffIds }: AssignStaffSectionProps) {
  const t = useTranslations("aidsPrograms.assignStaff");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staffList, setStaffList] = useState<Array<{ id: number; name: string }>>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<number[]>(initialAssignedStaffIds);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>(initialAssignedStaffIds);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync with prop changes (when page refreshes)
  useEffect(() => {
    const ids = initialAssignedStaffIds.map((id) => Number(id)).filter((id) => !isNaN(id));
    setAssignedStaffIds(ids);
    setSelectedStaffIds(ids);
  }, [initialAssignedStaffIds]);

  // Load staff list
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const staffResult = await getActiveStaff();

      if (staffResult.success && staffResult.data) {
        setStaffList(
          staffResult.data.map((s) => ({
            id: s.id,
            name: s.name || "",
          }))
        );
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const handleToggleStaff = (staffId: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const handleSave = async () => {
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updateAidsProgram({
        id: program.id,
        staffIds: selectedStaffIds,
      });

      if (result.success) {
        setAssignedStaffIds(selectedStaffIds);
        setSuccessMessage(t("saveSuccess") || "Staff assignments saved successfully!");
        router.refresh();
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        alert(result.error || t("saveError"));
      }
    });
  };

  const hasChanges = JSON.stringify(assignedStaffIds.sort()) !== JSON.stringify(selectedStaffIds.sort());

  if (loading) {
    return (
      <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">{t("title")}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t("description")}</p>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("selectStaff")}
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            {staffList.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("noStaffAvailable")}</p>
            ) : (
              staffList.map((staff) => (
                <label
                  key={staff.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedStaffIds.includes(staff.id)}
                    onChange={() => handleToggleStaff(staff.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm flex-1">{staff.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {selectedStaffIds.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("selectedStaff")} ({selectedStaffIds.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedStaffIds.map((staffId) => {
                const staff = staffList.find((s) => s.id === staffId);
                return (
                  <span
                    key={staffId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {staff?.name || `Staff ${staffId}`}
                    <button
                      type="button"
                      onClick={() => handleToggleStaff(staffId)}
                      className="hover:text-blue-600 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {isPending ? t("saving") : t("saveAssignments")}
        </Button>
      </div>
    </div>
  );
}
