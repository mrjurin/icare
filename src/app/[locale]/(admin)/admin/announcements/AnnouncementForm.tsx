"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
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

type AnnouncementFormProps = {
  announcement?: Announcement | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function AnnouncementForm({
  announcement,
  onSuccess,
  onCancel,
}: AnnouncementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(!!announcement);

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

  const [formData, setFormData] = useState<CreateAnnouncementInput>(() => getInitialFormData(announcement));

  // Sync form data when announcement prop changes (for editing)
  useEffect(() => {
    if (announcement) {
      const newFormData = getInitialFormData(announcement);
      setFormData(newFormData);
      setIsOpen(true);
    }
  }, [announcement?.id]);

  // Listen for show form event when creating new announcement
  useEffect(() => {
    if (!announcement) {
      const handleShow = () => {
        setIsOpen(true);
        setFormData(getInitialFormData(null));
        // Remove hidden class from the container
        const formElement = document.getElementById("new-announcement-form");
        if (formElement) {
          formElement.classList.remove("hidden");
        }
      };
      window.addEventListener("showNewAnnouncementForm", handleShow);
      return () => window.removeEventListener("showNewAnnouncementForm", handleShow);
    }
  }, [announcement]);

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
      if (announcement) {
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

      // Reset form if creating new
      if (!announcement) {
        setFormData(getInitialFormData(null));
        setIsOpen(false);
      } else {
        // Close edit form after successful update
        setIsOpen(false);
      }

      onSuccess?.();
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (announcement) {
      // Reset to original values
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        publishedAt: new Date(announcement.published_at).toISOString().slice(0, 16),
        expiresAt: announcement.expires_at
          ? new Date(announcement.expires_at).toISOString().slice(0, 16)
          : null,
      });
    } else {
      setFormData({
        title: "",
        content: "",
        category: "general",
        publishedAt: new Date().toISOString().slice(0, 16),
        expiresAt: null,
      });
    }
    setIsOpen(false);
    onCancel?.();
  };

  // Always render the container so the ID exists for scrolling
  return (
    <div
      id={!announcement ? "new-announcement-form" : undefined}
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 ${!isOpen && !announcement ? "hidden" : ""}`}
    >
      {isOpen && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {announcement ? "Edit Announcement" : "Compose New Announcement"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {announcement
                  ? "Update the announcement details."
                  : "Create and schedule announcements for the community."}
              </p>
            </div>
            {announcement && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

          <div className="flex justify-end gap-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Send className="size-5" />
              <span>{announcement ? "Update Announcement" : "Publish Announcement"}</span>
            </Button>
          </div>
        </form>
        </>
      )}
    </div>
  );
}
