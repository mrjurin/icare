"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, MapPin, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createZone,
  updateZone,
  type Zone,
  type CreateZoneInput,
} from "@/lib/actions/zones";
import { getReferenceDataList } from "@/lib/actions/reference-data";
import SearchableSelect from "@/components/ui/SearchableSelect";

type Props = {
  trigger: ReactNode;
  zone?: Zone;
};

export default function ZoneFormModal({ trigger, zone }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duns, setDuns] = useState<Array<{ id: number; name: string }>>([]);

  const isEdit = !!zone;

  const [formData, setFormData] = useState<CreateZoneInput>({
    dunId: (zone as any)?.dun_id || 0,
    name: zone?.name || "",
    description: zone?.description || "",
  });

  // Load DUNs when modal opens
  useEffect(() => {
    if (open) {
      const loadDuns = async () => {
        const result = await getReferenceDataList("duns");
        if (result.success && result.data) {
          setDuns(result.data.map((d: any) => ({ id: d.id, name: d.name })));
        }
      };
      loadDuns();
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        dunId: (zone as any)?.dun_id || 0,
        name: zone?.name || "",
        description: zone?.description || "",
      });
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result;
      if (isEdit && zone) {
        result = await updateZone({
          id: zone.id,
          ...formData,
        });
      } else {
        result = await createZone(formData);
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
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
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Zone" : "Add New Zone"}
            </Dialog.Title>
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

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DUN <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={duns.map((d) => ({ value: d.id, label: d.name }))}
                  value={formData.dunId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      dunId: value ? parseInt(String(value), 10) : 0,
                    })
                  }
                  placeholder="Select DUN..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Zone A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                placeholder="Optional description for this zone..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
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
                {isEdit ? "Save Changes" : "Add Zone"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
