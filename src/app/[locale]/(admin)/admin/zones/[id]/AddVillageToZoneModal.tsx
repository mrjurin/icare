"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, MapPin, Plus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  getVillagesNotInZone,
  updateVillage,
  createVillage,
  type Village,
  type CreateVillageInput,
} from "@/lib/actions/villages";
import { getCawangan } from "@/lib/actions/cawangan";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactNode;
  zoneId: number;
  zoneName: string;
};

type TabType = "existing" | "new";

export default function AddVillageToZoneModal({ trigger, zoneId, zoneName }: Props) {
  const router = useRouter();
  const t = useTranslations("zones.detail.addVillageModal");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("existing");
  const [existingVillages, setExistingVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillageIds, setSelectedVillageIds] = useState<Set<number>>(new Set());
  const [cawangan, setCawangan] = useState<Array<{ id: number; name: string }>>([]);
  const [defaultCawanganId, setDefaultCawanganId] = useState<number>(0);

  // Form data for creating new village
  const [formData, setFormData] = useState<CreateVillageInput>({
    cawanganId: 0,
    name: "",
    description: "",
  });

  // Load cawangan for this zone when modal opens
  useEffect(() => {
    if (open) {
      const loadCawangan = async () => {
        const result = await getCawangan(zoneId);
        if (result.success && result.data && result.data.length > 0) {
          setCawangan(result.data.map((c) => ({ id: c.id, name: c.name })));
          setDefaultCawanganId(result.data[0].id);
          setFormData((prev) => ({ ...prev, cawanganId: result.data![0].id }));
        }
      };
      loadCawangan();
    }
  }, [open, zoneId]);

  // Load existing villages when modal opens and existing tab is active
  useEffect(() => {
    if (open && activeTab === "existing") {
      loadExistingVillages();
    }
  }, [open, activeTab, zoneId]);

  const loadExistingVillages = async () => {
    setLoadingVillages(true);
    setError(null);
    const result = await getVillagesNotInZone(zoneId);
    if (result.success) {
      setExistingVillages(result.data || []);
    } else {
      setError(result.error || "Failed to load villages");
      setExistingVillages([]);
    }
    setLoadingVillages(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setActiveTab("existing");
      setSearchQuery("");
      setSelectedVillageIds(new Set());
      setFormData({
        cawanganId: defaultCawanganId || 0,
        name: "",
        description: "",
      });
      setError(null);
    }
  };

  const handleAddExistingVillages = () => {
    if (selectedVillageIds.size === 0) {
      setError("Please select at least one village to add");
      return;
    }

    setError(null);
    startTransition(async () => {
      const villageIds = Array.from(selectedVillageIds);
      let successCount = 0;
      let errorMessages: string[] = [];

      // Get a cawangan from this zone to assign villages to
      const cawanganResult = await getCawangan(zoneId);
      if (!cawanganResult.success || !cawanganResult.data || cawanganResult.data.length === 0) {
        setError("No cawangan found for this zone. Please create a cawangan first.");
        return;
      }
      const targetCawanganId = cawanganResult.data[0].id;

      for (const villageId of villageIds) {
        const result = await updateVillage({
          id: villageId,
          cawanganId: targetCawanganId,
        });

        if (result.success) {
          successCount++;
        } else {
          errorMessages.push(result.error || "Failed to add village");
        }
      }

      if (successCount > 0) {
        setOpen(false);
        router.refresh();
      } else {
        setError(errorMessages.join(", ") || "Failed to add villages");
      }
    });
  };

  const handleCreateNewVillage = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError("Village name is required");
      return;
    }

    startTransition(async () => {
      const result = await createVillage(formData);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  const filteredVillages = existingVillages.filter((village) =>
    village.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleVillageSelection = (villageId: number) => {
    const newSelection = new Set(selectedVillageIds);
    if (newSelection.has(villageId)) {
      newSelection.delete(villageId);
    } else {
      newSelection.add(villageId);
    }
    setSelectedVillageIds(newSelection);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {t("title", { zoneName })}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t("description")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab("existing")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "existing"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t("existingTab")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "new"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t("newTab")}
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {activeTab === "existing" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("existingDescription")}
                  </p>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Village List */}
                  {loadingVillages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredVillages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <MapPin className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {searchQuery
                          ? t("noVillagesFound")
                          : t("noAvailableVillages")}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                      {filteredVillages.map((village) => (
                        <label
                          key={village.id}
                          className={`flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            selectedVillageIds.has(village.id)
                              ? "bg-primary/5"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVillageIds.has(village.id)}
                            onChange={() => toggleVillageSelection(village.id)}
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {village.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("currentZone")}: {village.zones?.name || `Zone ${village.zone_id}`}
                            </div>
                            {village.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {village.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline" disabled={isPending}>
                        {t("cancel")}
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="button"
                      onClick={handleAddExistingVillages}
                      disabled={isPending || selectedVillageIds.size === 0}
                      className="gap-2"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      {t("addSelected", { count: selectedVillageIds.size })}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateNewVillage} className="space-y-5">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("newDescription")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("cawanganLabel") || "Cawangan"} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cawanganId}
                    onChange={(e) => setFormData({ ...formData, cawanganId: parseInt(e.target.value, 10) })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value={0}>{t("selectCawangan") || "Select a cawangan"}</option>
                    {cawangan.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("villageNameLabel")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={t("villageNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("descriptionLabel")}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" disabled={isPending}>
                      {t("cancel")}
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    {t("createVillage")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
