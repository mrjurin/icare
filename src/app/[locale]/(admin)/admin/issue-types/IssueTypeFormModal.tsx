"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createIssueType,
  updateIssueType,
  type IssueType,
  type CreateIssueTypeInput,
  type UpdateIssueTypeInput,
} from "@/lib/actions/issue-types";

type IssueTypeFormModalProps = {
  data: IssueType | null;
  trigger: React.ReactNode;
};

export default function IssueTypeFormModal({
  data,
  trigger,
}: IssueTypeFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateIssueTypeInput>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    displayOrder: 0,
  });

  // Initialize form data
  useEffect(() => {
    if (data && open) {
      setFormData({
        name: data.name || "",
        code: data.code || "",
        description: data.description || "",
        isActive: data.is_active ?? true,
        displayOrder: data.display_order ?? 0,
      });
    } else if (open) {
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
        displayOrder: 0,
      });
    }
    setError(null);
  }, [data, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result;

      if (data) {
        // Update
        const updateInput: UpdateIssueTypeInput = {
          id: data.id,
          ...formData,
        };
        result = await updateIssueType(updateInput);
      } else {
        // Create
        result = await createIssueType(formData);
      }

      if (!result.success) {
        setError(result.error || "Failed to save issue type");
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {data ? "Edit Issue Type" : "Add Issue Type"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Road Maintenance"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code (Optional)
              </label>
              <Input
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., road_maintenance"
                disabled={isPending}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional code for programmatic reference. Must be unique if provided.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this issue type"
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-1 focus:border-primary focus:ring-primary resize-y"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.displayOrder ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                disabled={isPending}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lower numbers appear first in dropdowns. Default: 0
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isPending}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active (visible to community users)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : data ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}














