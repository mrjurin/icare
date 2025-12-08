"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createAidsProgram,
  updateAidsProgram,
  type AidsProgram,
  type CreateAidsProgramInput,
  type UpdateAidsProgramInput,
} from "@/lib/actions/aidsPrograms";
import { getZones } from "@/lib/actions/zones";
import { useTranslations } from "next-intl";

type AidsProgramFormProps = {
  program?: AidsProgram | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function AidsProgramForm({
  program,
  onSuccess,
  onCancel,
}: AidsProgramFormProps) {
  const t = useTranslations("aidsPrograms.form");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(!!program);
  const [zones, setZones] = useState<Array<{ id: number; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: number; name: string; zone_id: number }>>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<number[]>([]);

  // Initialize form data
  const getInitialFormData = (prog?: AidsProgram | null): CreateAidsProgramInput => {
    const startDate = prog?.start_date
      ? new Date(prog.start_date).toISOString().slice(0, 16)
      : undefined;

    const endDate = prog?.end_date
      ? new Date(prog.end_date).toISOString().slice(0, 16)
      : undefined;

    return {
      name: prog?.name || "",
      description: prog?.description || "",
      aidType: prog?.aid_type || "",
      startDate,
      endDate,
      notes: prog?.notes || "",
    };
  };

  const [formData, setFormData] = useState<CreateAidsProgramInput>(() =>
    getInitialFormData(program)
  );

  // Load zones and villages
  useEffect(() => {
    const loadData = async () => {
      const zonesResult = await getZones();
      if (zonesResult.success && zonesResult.data) {
        setZones(zonesResult.data);
      }

      const { getVillages } = await import("@/lib/actions/villages");
      const villagesResult = await getVillages();
      if (villagesResult.success && villagesResult.data) {
        setVillages(villagesResult.data.map((v) => ({
          id: v.id,
          name: v.name,
          zone_id: v.zone_id,
        })));
      }
    };
    loadData();
  }, []);

  // Load program zones/villages if editing
  useEffect(() => {
    if (program) {
      const loadProgramZones = async () => {
        const { getProgramZones } = await import("@/lib/actions/aidsPrograms");
        const result = await getProgramZones(program.id);
        if (result.success && result.data) {
          const zoneIds = result.data
            .map((pz) => pz.zone_id)
            .filter((id): id is number => id !== null);
          const villageIds = result.data
            .map((pz) => pz.village_id)
            .filter((id): id is number => id !== null);
          setSelectedZones(zoneIds);
          setSelectedVillages(villageIds);
        }
      };
      loadProgramZones();
    }
  }, [program?.id]);

  // Sync form data when program prop changes
  useEffect(() => {
    if (program) {
      const newFormData = getInitialFormData(program);
      setFormData(newFormData);
      setIsOpen(true);
    }
  }, [program?.id]);

  // Listen for show form event when creating new program
  useEffect(() => {
    if (!program) {
      const handleShow = () => {
        setIsOpen(true);
        setFormData(getInitialFormData(null));
        setSelectedZones([]);
        setSelectedVillages([]);
        const formElement = document.getElementById("new-aids-program-form");
        if (formElement) {
          formElement.classList.remove("hidden");
        }
      };
      window.addEventListener("showNewAidsProgramForm", handleShow);
      return () => window.removeEventListener("showNewAidsProgramForm", handleShow);
    }
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert(t("programNameRequired"));
      return;
    }

    if (!formData.aidType?.trim()) {
      alert(t("aidTypeRequired"));
      return;
    }

    if (selectedZones.length === 0 && selectedVillages.length === 0) {
      alert(t("selectZonesRequired"));
      return;
    }

    startTransition(async () => {
      let result;
      if (program) {
        const updateInput: UpdateAidsProgramInput = {
          id: program.id,
          name: formData.name,
          description: formData.description,
          aidType: formData.aidType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes,
        };
        result = await updateAidsProgram(updateInput);
      } else {
        const createInput: CreateAidsProgramInput = {
          ...formData,
          zoneIds: selectedZones.length > 0 ? selectedZones : undefined,
          villageIds: selectedVillages.length > 0 ? selectedVillages : undefined,
        };
        result = await createAidsProgram(createInput);
      }

      if (result.success) {
        setIsOpen(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || t("saveError"));
      }
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="new-aids-program-form"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="bg-white dark:bg-background-dark rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {program ? t("editTitle") : t("createTitle")}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("programName")} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder={t("programNamePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("aidType")} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder={t("aidTypePlaceholder")}
              value={formData.aidType}
              onChange={(e) => setFormData({ ...formData, aidType: e.target.value })}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("description")}
            </label>
            <textarea
              placeholder={t("descriptionPlaceholder")}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("startDate")}
              </label>
              <Input
                type="datetime-local"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("endDate")}
              </label>
              <Input
                type="datetime-local"
                value={formData.endDate || ""}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("selectZones")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {zones.map((zone) => (
                <label key={zone.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedZones.includes(zone.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedZones([...selectedZones, zone.id]);
                        // Remove villages from this zone when zone is selected
                        setSelectedVillages(
                          selectedVillages.filter(
                            (vid) => villages.find((v) => v.id === vid)?.zone_id !== zone.id
                          )
                        );
                      } else {
                        setSelectedZones(selectedZones.filter((id) => id !== zone.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{zone.name}</span>
                </label>
              ))}
            </div>
            {zones.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("noZonesAvailable")}
              </p>
            )}
          </div>

          {selectedZones.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("orSelectVillages")}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {villages.map((village) => (
                  <label key={village.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVillages.includes(village.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVillages([...selectedVillages, village.id]);
                        } else {
                          setSelectedVillages(selectedVillages.filter((id) => id !== village.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{village.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("notes")}
            </label>
            <textarea
              placeholder={t("notesPlaceholder")}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              <Send className="w-4 h-4 mr-2" />
              {isPending ? t("saving") : program ? t("updateProgram") : t("createProgram")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
