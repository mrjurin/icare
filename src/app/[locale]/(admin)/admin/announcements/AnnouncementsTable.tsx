"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import { deleteAnnouncement, type Announcement } from "@/lib/actions/announcements";
import AnnouncementFormModal from "./AnnouncementFormModal";

type AnnouncementsTableProps = {
  announcements: Announcement[];
  pagination?: PaginationProps | null;
};

function getAnnouncementStatus(announcement: Announcement): {
  label: string;
  class: string;
} {
  const now = new Date();
  const publishedAt = new Date(announcement.published_at);
  const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;

  if (expiresAt && now > expiresAt) {
    return {
      label: "Expired",
      class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
  }

  if (now >= publishedAt) {
    return {
      label: "Published",
      class: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    };
  }

  return {
    label: "Scheduled",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  };
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AnnouncementsTable({
  announcements,
  pagination,
}: AnnouncementsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteAnnouncement(deleteTarget.id);
      if (!result.success) {
        alert(result.error || "Failed to delete announcement");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
        <h3 className="text-lg font-semibold">All Announcements</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage all past and scheduled announcements.
        </p>
      </div>

      {/* Table */}
      <DataTable
        pagination={pagination || undefined}
        emptyMessage="No announcements found. Create your first announcement to get started."
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Title
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Category
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Publish Date
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {announcements.length === 0 ? (
              <DataTableEmpty
                colSpan={6}
                message="No announcements found. Create your first announcement to get started."
              />
            ) : (
              announcements.map((announcement) => {
                const status = getAnnouncementStatus(announcement);
                return (
                  <tr
                    key={announcement.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{announcement.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(announcement.published_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {announcement.expires_at
                        ? formatDateTime(announcement.expires_at)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AnnouncementFormModal
                          announcement={announcement}
                          trigger={
                            <button
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Edit"
                              disabled={isPending}
                            >
                              <Edit className="size-4" />
                            </button>
                          }
                        />
                        <button
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete"
                          onClick={() => setDeleteTarget(announcement)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTable>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Delete Announcement
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.title}</span>? This action cannot be
              undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
