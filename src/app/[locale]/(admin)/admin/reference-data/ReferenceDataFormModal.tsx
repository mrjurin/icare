"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createReferenceData,
  updateReferenceData,
  getReferenceDataList,
  type ReferenceData,
  type ReferenceTable,
  type CreateReferenceDataInput,
  type UpdateReferenceDataInput,
} from "@/lib/actions/reference-data";
import { getTableDisplayName } from "@/lib/utils/reference-data";
import SearchableSelect from "@/components/ui/SearchableSelect";

type ReferenceDataFormModalProps = {
  table: ReferenceTable;
  data: ReferenceData | null;
  trigger: React.ReactNode;
};

export default function ReferenceDataFormModal({
  table,
  data,
  trigger,
}: ReferenceDataFormModalProps) {
  const router = useRouter();
  const t = useTranslations("referenceData");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [parliaments, setParliaments] = useState<ReferenceData[]>([]);
  const [duns, setDuns] = useState<ReferenceData[]>([]);
  const [districts, setDistricts] = useState<ReferenceData[]>([]);
  const [localities, setLocalities] = useState<ReferenceData[]>([]);
  const displayName = getTableDisplayName(table, t);

  const [formData, setFormData] = useState<CreateReferenceDataInput>({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  // Load related data for localities and polling stations
  useEffect(() => {
    if (open && (table === "localities" || table === "polling_stations")) {
      const loadData = async () => {
        const [parlResult, dunResult, districtResult] = await Promise.all([
          getReferenceDataList("parliaments"),
          getReferenceDataList("duns"),
          getReferenceDataList("districts"),
        ]);

        if (parlResult.success) setParliaments(parlResult.data || []);
        if (dunResult.success) setDuns(dunResult.data || []);
        if (districtResult.success) setDistricts(districtResult.data || []);

        if (table === "polling_stations") {
          const localityResult = await getReferenceDataList("localities");
          if (localityResult.success) setLocalities(localityResult.data || []);
        }
      };
      loadData();
    }
  }, [open, table]);

  // Initialize form data
  useEffect(() => {
    if (data && open) {
      setFormData({
        name: data.name || "",
        code: data.code || "",
        description: data.description || "",
        isActive: data.is_active ?? true,
        parliamentId: (data as any).parliament_id || undefined,
        dunId: (data as any).dun_id || undefined,
        districtId: (data as any).district_id || undefined,
        localityId: (data as any).locality_id || undefined,
        address: (data as any).address || "",
      });
    } else if (open) {
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
      });
    }
  }, [data, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert(t("form.nameRequired"));
      return;
    }

    startTransition(async () => {
      let result;
      if (data) {
        const updateInput: UpdateReferenceDataInput = {
          id: data.id,
          ...formData,
        };
        result = await updateReferenceData(table, updateInput);
      } else {
        result = await createReferenceData(table, formData);
      }

      if (!result.success) {
        alert(result.error || t("form.saveFailed"));
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {data ? t("form.editTitle", { displayName }) : t("form.addTitle", { displayName })}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {t("form.name")} *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {t("form.code")}
              </label>
              <Input
                type="text"
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={isPending}
              />
            </div>

            {table === "localities" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    {t("form.parliament")}
                  </label>
                  <SearchableSelect
                    options={parliaments.map((p) => ({ value: p.id, label: p.name }))}
                    value={formData.parliamentId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        parliamentId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder={t("form.selectParliament")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    {t("form.dun")}
                  </label>
                  <SearchableSelect
                    options={duns.map((d) => ({ value: d.id, label: d.name }))}
                    value={formData.dunId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        dunId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder={t("form.selectDun")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    {t("form.district")}
                  </label>
                  <SearchableSelect
                    options={districts.map((d) => ({ value: d.id, label: d.name }))}
                    value={formData.districtId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        districtId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder={t("form.selectDistrict")}
                  />
                </div>
              </>
            )}

            {table === "polling_stations" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    {t("form.locality")}
                  </label>
                  <SearchableSelect
                    options={localities.map((l) => ({ value: l.id, label: l.name }))}
                    value={formData.localityId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        localityId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder={t("form.selectLocality")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    {t("form.address")}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    disabled={isPending}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {t("form.description")}
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-active"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={isPending}
                className="rounded border-gray-300"
              />
              <label
                htmlFor="is-active"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("form.active")}
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  {t("form.cancel")}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {data ? t("form.update") : t("form.create")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
