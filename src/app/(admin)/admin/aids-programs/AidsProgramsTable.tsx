"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Eye, CheckCircle2, XCircle, RotateCcw, Trash2 } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import { updateAidsProgram, deleteAidsProgram, type AidsProgram } from "@/lib/actions/aidsPrograms";
import AidsProgramForm from "./AidsProgramForm";
import Link from "next/link";

type AidsProgramsTableProps = {
  programs: AidsProgram[];
};

function getStatusBadge(status: string): { label: string; class: string } {
  const statusMap: Record<string, { label: string; class: string }> = {
    draft: {
      label: "Draft",
      class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    },
    active: {
      label: "Active",
      class: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    },
    completed: {
      label: "Completed",
      class: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    },
    cancelled: {
      label: "Cancelled",
      class: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    },
  };

  return statusMap[status] || statusMap.draft;
}

export default function AidsProgramsTable({ programs }: AidsProgramsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingProgram, setEditingProgram] = useState<AidsProgram | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    program: AidsProgram;
    newStatus: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AidsProgram | null>(null);

  const handleStatusChange = async (program: AidsProgram, newStatus: string) => {
    setStatusChangeTarget({ program, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusChangeTarget) return;

    startTransition(async () => {
      const result = await updateAidsProgram({
        id: statusChangeTarget.program.id,
        status: statusChangeTarget.newStatus,
      });
      if (result.success) {
        setStatusChangeTarget(null);
        router.refresh();
      } else {
        alert(result.error || "Failed to update program status");
      }
    });
  };

  const handleDelete = async (program: AidsProgram) => {
    setDeleteTarget(program);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteAidsProgram(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete program");
      }
    });
  };

  return (
    <>
      <DataTable>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Program Name
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Aid Type
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Progress
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Created
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {programs.length === 0 ? (
              <DataTableEmpty
                message="No programs found. Create your first AIDS distribution program to get started."
                colSpan={6}
              />
            ) : (
              programs.map((program) => {
                const statusBadge = getStatusBadge(program.status);
                const progress =
                  program.total_households && program.total_households > 0
                    ? Math.round(
                        ((program.distributed_households || 0) / program.total_households) * 100
                      )
                    : 0;

                return (
                  <tr key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{program.name}</div>
                        {program.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {program.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{program.aid_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {program.distributed_households || 0}/{program.total_households || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(program.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/aids-programs/${program.id}`}>
                          <Button variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => setEditingProgram(program)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {program.status === "draft" && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusChange(program, "active")}
                              disabled={isPending}
                              title="Activate Program"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(program)}
                              disabled={isPending}
                              title="Delete Program"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {program.status === "active" && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(program, "completed")}
                            disabled={isPending}
                            title="Complete Program"
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {(program.status === "completed" || program.status === "cancelled") && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(program, "active")}
                            disabled={isPending}
                            title="Reactivate Program"
                          >
                            <RotateCcw className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTable>

      {editingProgram && (
        <AidsProgramForm
          program={editingProgram}
          onSuccess={() => {
            setEditingProgram(null);
            router.refresh();
          }}
          onCancel={() => setEditingProgram(null)}
        />
      )}

      {/* Status Change Confirmation Dialog */}
      {statusChangeTarget && (
        <AlertDialog.Root
          open={true}
          onOpenChange={(open) => !open && setStatusChangeTarget(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
              <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {statusChangeTarget.newStatus === "completed"
                  ? "Complete Program"
                  : "Reactivate Program"}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {statusChangeTarget.newStatus === "completed"
                  ? `Are you sure you want to mark "${statusChangeTarget.program.name}" as completed? This will change the program status to completed.`
                  : `Are you sure you want to reactivate "${statusChangeTarget.program.name}"? This will change the program status back to active.`}
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    onClick={confirmStatusChange}
                    disabled={isPending}
                    className={
                      statusChangeTarget.newStatus === "completed"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {isPending
                      ? "Saving..."
                      : statusChangeTarget.newStatus === "completed"
                      ? "Complete"
                      : "Reactivate"}
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <AlertDialog.Root
          open={true}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
              <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Program
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{deleteTarget.name}"? This action cannot be undone. Only draft programs can be deleted.
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    onClick={confirmDelete}
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </>
  );
}
