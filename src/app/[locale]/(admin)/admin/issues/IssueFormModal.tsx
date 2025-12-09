"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createIssue, type CreateIssueInput } from "@/lib/actions/issues";
import { useTranslations } from "next-intl";
import MediaUploader from "./MediaUploader";

type Props = {
  trigger: ReactNode;
};

export default function IssueFormModal({ trigger }: Props) {
  const t = useTranslations("issues.form");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<Array<{ url: string; type?: string; size_bytes?: number }>>([]);

  const [formData, setFormData] = useState<CreateIssueInput>({
    title: "",
    description: "",
    category: "other",
    address: "",
    lat: undefined,
    lng: undefined,
    status: "pending",
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        title: "",
        description: "",
        category: "other",
        address: "",
        lat: undefined,
        lng: undefined,
        status: "pending",
      });
      setMedia([]);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError(t("titleRequired") || "Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError(t("descriptionRequired") || "Description is required");
      return;
    }
    if (!formData.address.trim()) {
      setError(t("addressRequired") || "Address is required");
      return;
    }

    startTransition(async () => {
      const result = await createIssue({
        ...formData,
        media: media.length > 0 ? media : undefined,
      });

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || t("error") || "Failed to create issue");
      }
    });
  };

  const categoryOptions = [
    { value: "road_maintenance", label: t("categories.roadMaintenance") || "Road Maintenance" },
    { value: "drainage", label: t("categories.drainage") || "Drainage" },
    { value: "public_safety", label: t("categories.publicSafety") || "Public Safety" },
    { value: "sanitation", label: t("categories.sanitation") || "Sanitation" },
    { value: "other", label: t("categories.other") || "Other" },
  ];

  const statusOptions = [
    { value: "pending", label: t("status.pending") || "Pending" },
    { value: "in_progress", label: t("status.inProgress") || "In Progress" },
    { value: "resolved", label: t("status.resolved") || "Resolved" },
    { value: "closed", label: t("status.closed") || "Closed" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {t("addNewIssue") || "Add New Issue"}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t("createNewIssue") || "Create a new issue"}
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
                {t("title") || "Title"} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder={t("titlePlaceholder") || "Enter issue title"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("category") || "Category"} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CreateIssueInput["category"],
                  })
                }
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("description") || "Description"} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-1 focus:border-primary focus:ring-primary resize-y min-h-[100px]"
                placeholder={t("descriptionPlaceholder") || "Enter issue description"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("address") || "Address"} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder={t("addressPlaceholder") || "Enter address or landmark"}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("latitude") || "Latitude"} (optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={t("latitudePlaceholder") || "e.g., 6.1234"}
                  value={formData.lat ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lat: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("longitude") || "Longitude"} (optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={t("longitudePlaceholder") || "e.g., 116.1234"}
                  value={formData.lng ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lng: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("statusLabel") || "Status"}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CreateIssueInput["status"],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("attachMedia") || "Attach Media"} (optional)
              </label>
              <MediaUploader onMediaChange={setMedia} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  {t("cancel") || "Cancel"}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {t("createIssue") || "Create Issue"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
