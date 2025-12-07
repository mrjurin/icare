"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Send } from "lucide-react";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import Button from "@/components/ui/Button";
import {
  createAnnouncement,
  updateAnnouncement,
  type Announcement,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from "@/lib/actions/announcements";

type AnnouncementFormModalProps = {
  trigger: ReactNode;
  announcement?: Announcement | null;
};

export default function AnnouncementFormModal({
  trigger,
  announcement,
}: AnnouncementFormModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!announcement;

  // Initialize form data helper
  const getInitialFormData = (ann?: Announcement | null): CreateAnnouncementInput => {
    const publishedAt = ann?.published_at
      ? new Date(ann.published_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    const expiresAt = ann?.expires_at
      ? new Date(ann.expires_at).toISOString().slice(0, 16)
      : null;

    return {
      title: ann?.title || "",
      content: ann?.content || "",
      category: ann?.category || "general",
      publishedAt,
      expiresAt,
    };
  };

  const [formData, setFormData] = useState<CreateAnnouncementInput>(() =>
    getInitialFormData(announcement)
  );

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData(getInitialFormData(announcement));
    }
  };

  // Sync form data when announcement prop changes (for editing)
  useEffect(() => {
    if (announcement && open) {
      setFormData(getInitialFormData(announcement));
    }
  }, [announcement?.id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      alert("Title is required");
      return;
    }

    if (!formData.content?.trim()) {
      alert("Content is required");
      return;
    }

    startTransition(async () => {
      let result;
      if (isEdit && announcement) {
        const updateInput: UpdateAnnouncementInput = {
          id: announcement.id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          publishedAt: formData.publishedAt,
          expiresAt: formData.expiresAt,
        };
        result = await updateAnnouncement(updateInput);
      } else {
        result = await createAnnouncement(formData);
      }

      if (!result.success) {
        alert(result.error || "Failed to save announcement");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Announcement" : "Create New Announcement"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="announcement-title"
              >
                Announcement Title
              </label>
              <Input
                id="announcement-title"
                type="text"
                placeholder="e.g., Community Clean-up Day"
                className="mt-1 block w-full"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="announcement-category"
              >
                Category
              </label>
              <select
                id="announcement-category"
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={isPending}
              >
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="notice">Notice</option>
                <option value="update">Update</option>
              </select>
            </div>

            <div>
              <label
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="announcement-content"
              >
                Content
              </label>
              <div className="mt-1">
                <RichTextEditor
                  placeholder="Write your announcement here..."
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="publish-date"
                >
                  Publish Date
                </label>
                <Input
                  id="publish-date"
                  type="datetime-local"
                  className="mt-1 block w-full"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedAt: e.target.value })
                  }
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="expiry-date"
                >
                  Expiry Date (Optional)
                </label>
                <Input
                  id="expiry-date"
                  type="datetime-local"
                  className="mt-1 block w-full"
                  value={formData.expiresAt || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresAt: e.target.value || null,
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="gap-2">
                <Send className="size-5" />
                <span>{isEdit ? "Update Announcement" : "Publish Announcement"}</span>
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
