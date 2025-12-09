"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import {
  deleteIssueType,
  type IssueType,
} from "@/lib/actions/issue-types";
import IssueTypeFormModal from "./IssueTypeFormModal";

type IssueTypesTableProps = {
  data: IssueType[];
};

export default function IssueTypesTable({ data }: IssueTypesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<IssueType | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteIssueType(deleteTarget.id);
      if (!result.success) {
        alert(result.error || "Failed to delete");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Issue Types</h3>
          <IssueTypeFormModal
            data={null}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Add Issue Type
              </Button>
            }
          />
        </div>
      </div>

      <DataTable emptyMessage="No issue types found. Create your first one.">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Order
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Code
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Description
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.length === 0 ? (
              <DataTableEmpty
                colSpan={6}
                message="No issue types found. Create your first one."
              />
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {item.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {item.code || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {item.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <IssueTypeFormModal
                        data={item}
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
                        onClick={() => setDeleteTarget(item)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
              Delete Issue Type
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be
              undone. If there are issues using this type, deletion will be prevented.
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
