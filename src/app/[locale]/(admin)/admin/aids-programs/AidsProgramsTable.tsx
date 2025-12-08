"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Eye, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import { updateAidsProgram, type AidsProgram } from "@/lib/actions/aidsPrograms";
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

export default function AidsProgramsTable({ programs }: AidsProgramsTableProps) {
  const t = useTranslations("aidsPrograms");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingProgram, setEditingProgram] = useState<AidsProgram | null>(null);

  const handleStatusChange = async (program: AidsProgram, newStatus: string) => {
    startTransition(async () => {
      const result = await updateAidsProgram({
        id: program.id,
        status: newStatus,
      });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to update program status");
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
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(program, "active")}
                            disabled={isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {program.status === "active" && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange(program, "completed")}
                            disabled={isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
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
    </>
  );
}
