"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit, Trash2, Search, X, Filter } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import { deleteVoter, updateVoterVotingSupportStatus, type SprVoter } from "@/lib/actions/spr-voters";
import VoterFormModal from "./VoterFormModal";
import { useTranslations } from "next-intl";

type SprVotersTableProps = {
  voters: SprVoter[];
  pagination?: PaginationProps | null;
  versionId: number;
  search?: string;
  unmatchedOnly?: boolean;
};

export default function SprVotersTable({
  voters,
  pagination,
  versionId,
  search: initialSearch,
  unmatchedOnly: initialUnmatchedOnly = false,
}: SprVotersTableProps) {
  const t = useTranslations("sprVoters.table");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<SprVoter | null>(null);
  const [search, setSearch] = useState(initialSearch || "");
  const [editingVoter, setEditingVoter] = useState<SprVoter | null>(null);
  const [unmatchedOnly, setUnmatchedOnly] = useState(initialUnmatchedOnly);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to first page
    router.push(`/admin/spr-voters?${params.toString()}`);
  };

  const toggleUnmatchedFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    const newUnmatchedOnly = !unmatchedOnly;
    setUnmatchedOnly(newUnmatchedOnly);
    
    if (newUnmatchedOnly) {
      params.set("unmatchedOnly", "true");
    } else {
      params.delete("unmatchedOnly");
    }
    params.delete("page"); // Reset to first page
    router.push(`/admin/spr-voters?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteVoter(deleteTarget.id);
      if (!result.success) {
        alert(result.error || "Failed to delete voter");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleQuickUpdateVotingStatus = async (
    voterId: number,
    status: "white" | "black" | "red" | null
  ) => {
    startTransition(async () => {
      const result = await updateVoterVotingSupportStatus(voterId, status);
      if (!result.success) {
        alert(result.error || "Failed to update voting support status");
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("voters")}</h3>
          <VoterFormModal
            versionId={versionId}
            voter={null}
            trigger={
              <Button className="gap-2">
                {t("addVoter")}
              </Button>
            }
          />
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">
                {t("search")}
              </Button>
              {initialSearch && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("search");
                    params.delete("page");
                    router.push(`/admin/spr-voters?${params.toString()}`);
                  }}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={unmatchedOnly ? "primary" : "outline"}
              onClick={toggleUnmatchedFilter}
              className="gap-2"
            >
              <Filter className="size-4" />
              {unmatchedOnly ? t("showingUnmatchedOnly") : t("showUnmatchedOnly")}
            </Button>
            {unmatchedOnly && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ({voters.length === 1 ? t("unmatchedCount", { count: voters.length }) : t("unmatchedCountPlural", { count: voters.length })})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        pagination={pagination || undefined}
        emptyMessage={t("noVotersFound")}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("name")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("icNumber")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("address")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("locality")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("pollingStation")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("matchStatus")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("votingSupport")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {voters.length === 0 ? (
              <DataTableEmpty
                colSpan={8}
                message={unmatchedOnly ? t("noUnmatchedVoters") : t("noVotersFound")}
              />
            ) : (
              voters.map((voter) => (
                <tr
                  key={voter.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {voter.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {voter.no_kp || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {voter.alamat || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {voter.nama_lokaliti || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {voter.nama_tm || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {voter.household_member_id ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {t("matched")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {t("unmatched")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {[
                        { value: "white", label: t("whiteFullSupport") },
                        { value: "black", label: t("blackNotSupporting") },
                        { value: "red", label: t("redNotDetermined") },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleQuickUpdateVotingStatus(
                              voter.id,
                              voter.voting_support_status === option.value ? null : (option.value as "white" | "black" | "red")
                            )
                          }
                          disabled={isPending}
                          className={`
                            inline-flex items-center justify-center rounded-full w-8 h-8 text-xs font-medium border-2 transition-all
                            ${
                              voter.voting_support_status === option.value
                                ? option.value === "white"
                                  ? "bg-white border-gray-400 text-gray-900 shadow-md"
                                  : option.value === "black"
                                  ? "bg-gray-900 border-gray-700 text-white shadow-md"
                                  : "bg-red-600 border-red-700 text-white shadow-md"
                                : option.value === "white"
                                ? "bg-gray-50 border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400"
                                : option.value === "black"
                                ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                                : "bg-red-50 border-red-300 text-red-600 hover:bg-red-600 hover:border-red-700 hover:text-white"
                            }
                            ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          `}
                          title={
                            voter.voting_support_status === option.value
                              ? t("remove", { label: option.label })
                              : t("setAs", { label: option.label })
                          }
                        >
                          {option.value === "white" ? "W" : option.value === "black" ? "B" : "R"}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <VoterFormModal
                        versionId={versionId}
                        voter={voter}
                        trigger={
                          <button
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={t("edit")}
                            disabled={isPending}
                          >
                            <Edit className="size-4" />
                          </button>
                        }
                      />
                      <button
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={t("delete")}
                        onClick={() => setDeleteTarget(voter)}
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
              {t("deleteTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("deleteConfirm", { name: deleteTarget?.nama || "" })}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">{tCommon("cancel")}</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {t("delete")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
