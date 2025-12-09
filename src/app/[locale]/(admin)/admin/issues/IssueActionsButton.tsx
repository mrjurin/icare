"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { deleteIssue } from "@/lib/actions/issues";

type IssueActionsButtonProps = {
  issueId: number;
  reporterId: number | null;
};

export default function IssueActionsButton({ issueId, reporterId }: IssueActionsButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Admins cannot delete issues created by community users (reporterId is not null)
  const canDelete = reporterId === null;

  const handleDelete = () => {
    setOpen(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteIssue(issueId);
      if (result.success) {
        setDeleteDialogOpen(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete issue");
      }
    });
  };

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Actions"
          >
            <MoreVertical className="size-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 min-w-[160px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark shadow-lg p-1"
            sideOffset={4}
            align="end"
          >
            <Link
              href={`/admin/issues/${issueId}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye className="size-4" />
              <span>View Details</span>
            </Link>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => {
                setOpen(false);
                // TODO: Implement edit functionality
              }}
            >
              <Edit className="size-4" />
              <span>Edit</span>
            </button>
            {canDelete && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Delete Issue
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete issue #{issueId}? This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={confirmDelete}
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
