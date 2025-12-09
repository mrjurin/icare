"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, MapPin, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createVillage,
  updateVillage,
  type Village,
  type CreateVillageInput,
} from "@/lib/actions/villages";
import { getCawangan, type Cawangan } from "@/lib/actions/cawangan";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactNode;
  village?: Village;
  defaultZoneId?: number;
};

export default function VillageFormModal({ trigger, village, defaultZoneId }: Props) {
  const t = useTranslations("villages.form");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cawangan, setCawangan] = useState<Cawangan[]>([]);

  const isEdit = !!village;

  const [formData, setFormData] = useState<CreateVillageInput>({
    cawanganId: village?.cawangan_id || 0,
    name: village?.name || "",
    description: village?.description || "",
  });

  // Fetch cawangan when modal opens (filtered by zone if defaultZoneId provided)
  useEffect(() => {
    if (open) {
      getCawangan(defaultZoneId || undefined).then((result) => {
        if (result.success && result.data) {
          setCawangan(result.data);
        }
      });
    }
  }, [open, defaultZoneId]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        cawanganId: village?.cawangan_id || 0,
        name: village?.name || "",
        description: village?.description || "",
      });
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.cawanganId || formData.cawanganId === 0) {
      setError(t("pleaseSelectCawangan") || "Please select a cawangan");
      return;
    }

    startTransition(async () => {
      let result;
      if (isEdit && village) {
        result = await updateVillage({
          id: village.id,
          ...formData,
        });
      } else {
        result = await createVillage(formData);
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || t("error"));
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {isEdit ? t("editVillage") : t("addNewVillage")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {isEdit ? t("editVillageInfo") : t("createNewVillage")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("cawangan") || "Cawangan"} <span className="text-red-500">*</span>
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
                {t("villageName")} <span className="text-red-500">*</span>
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
                {t("description")}
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
                ) : isEdit ? (
                  <Save className="size-4" />
                ) : (
                  <MapPin className="size-4" />
                )}
                {isEdit ? t("saveChanges") : t("addVillage")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
