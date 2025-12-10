"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit, Eye, CheckCircle2, XCircle, RotateCcw, Trash2, Search, X } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Pagination, { PaginationProps } from "@/components/ui/Pagination";
import { updateAidsProgram, deleteAidsProgram, type AidsProgram } from "@/lib/actions/aidsPrograms";
import AidsProgramForm from "./AidsProgramForm";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type AidsProgramsTableProps = {
  programs: AidsProgram[];
  pagination?: PaginationProps;
  initialFilters: {
    status: string;
    year: string;
    search: string;
  };
};

function getStatusBadge(status: string, t: any): { label: string; class: string } {
  const statusMap: Record<string, { label: string; class: string }> = {
    draft: {
      label: t("table.statuses.draft"),
      class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    },
    active: {
      label: t("table.statuses.active"),
      class: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    },
    completed: {
      label: t("table.statuses.completed"),
      class: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    },
    cancelled: {
      label: t("table.statuses.cancelled"),
      class: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    },
  };

  return statusMap[status] || statusMap.draft;
}

export default function AidsProgramsTable({
  programs,
  pagination,
  initialFilters,
}: AidsProgramsTableProps) {
  const t = useTranslations("aidsPrograms");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editingProgram, setEditingProgram] = useState<AidsProgram | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    program: AidsProgram;
    newStatus: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AidsProgram | null>(null);

  // Filter state
  const [search, setSearch] = useState(initialFilters.search);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [yearFilter, setYearFilter] = useState(initialFilters.year);

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (e.target.value) {
      params.set("status", e.target.value);
    } else {
      params.delete("status");
    }
    router.push(`?${params.toString()}`);
  };


  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearFilter(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (e.target.value) {
      params.set("year", e.target.value);
    } else {
      params.delete("year");
    }
    router.push(`?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setYearFilter("");
    router.push(window.location.pathname);
  };

  const hasActiveFilters = search.trim() || statusFilter || yearFilter;

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
        alert(result.error || t("table.statusChangeError") || "Failed to update program status");
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
        alert(result.error || t("table.deleteError") || "Failed to delete program");
      }
    });
  };

  return (
    <>
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder={t("table.searchPlaceholder") || "Search programs..."}
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {t("table.status") || "Status"}:
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[120px]"
            >
              <option value="">{t("table.allStatuses") || "All"}</option>
              <option value="draft">{t("table.statuses.draft")}</option>
              <option value="active">{t("table.statuses.active")}</option>
              <option value="completed">{t("table.statuses.completed")}</option>
              <option value="cancelled">{t("table.statuses.cancelled")}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {t("table.year") || "Year"}:
            </label>
            <select
              value={yearFilter}
              onChange={handleYearChange}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[100px]"
            >
              <option value="">{t("table.allYears") || "All Years"}</option>
              {yearOptions.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="h-10 px-3"
            >
              <X className="size-4 mr-1" />
              {t("table.resetFilters") || "Reset"}
            </Button>
          )}
        </div>
      </div>

      <DataTable pagination={pagination}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.programName")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.aidType")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.status")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.progress")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.created")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {programs.length === 0 ? (
              <DataTableEmpty
                message={t("table.noPrograms")}
                colSpan={6}
              />
            ) : (
              programs.map((program) => {
                const statusBadge = getStatusBadge(program.status, t);
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
                        {formatDate(program.created_at)}
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
                              title={t("table.activate") || "Activate Program"}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(program)}
                              disabled={isPending}
                              title={t("table.delete") || "Delete Program"}
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
                            title={t("table.complete")}
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {(program.status === "completed" || program.status === "cancelled") && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(program, "active")}
                            disabled={isPending}
                            title={t("table.reactivate")}
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
                  ? t("table.confirmCompleteTitle") || "Complete Program"
                  : t("table.confirmReactivateTitle") || "Reactivate Program"}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {statusChangeTarget.newStatus === "completed"
                  ? t("table.confirmCompleteMessage", { name: statusChangeTarget.program.name }) ||
                    `Are you sure you want to mark "${statusChangeTarget.program.name}" as completed? This will change the program status to completed.`
                  : t("table.confirmReactivateMessage", { name: statusChangeTarget.program.name }) ||
                    `Are you sure you want to reactivate "${statusChangeTarget.program.name}"? This will change the program status back to active.`}
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" disabled={isPending}>
                    {t("form.cancel") || "Cancel"}
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
                      ? t("table.saving") || "Saving..."
                      : statusChangeTarget.newStatus === "completed"
                      ? t("table.complete") || "Complete"
                      : t("table.reactivate") || "Reactivate"}
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
                {t("table.confirmDeleteTitle") || "Delete Program"}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t("table.confirmDeleteMessage", { name: deleteTarget.name }) ||
                  `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone. Only draft programs can be deleted.`}
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" disabled={isPending}>
                    {t("form.cancel") || "Cancel"}
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    onClick={confirmDelete}
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? t("table.deleting") || "Deleting..." : t("table.delete") || "Delete"}
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
