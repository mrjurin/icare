"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import { deleteReferenceData, type ReferenceData, type ReferenceTable } from "@/lib/actions/reference-data";
import { getTableDisplayName } from "@/lib/utils/reference-data";
import ReferenceDataFormModal from "./ReferenceDataFormModal";
import ImportExportSection from "./ImportExportSection";
import LocalityGeocodingSection from "@/app/[locale]/(admin)/admin/reference-data/LocalityGeocodingSection";
import ParliamentGeocodingSection from "@/app/[locale]/(admin)/admin/reference-data/ParliamentGeocodingSection";

type ReferenceDataTableProps = {
  table: ReferenceTable;
  data: ReferenceData[];
};

export default function ReferenceDataTable({ table, data }: ReferenceDataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ReferenceData | null>(null);
  const displayName = getTableDisplayName(table);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteReferenceData(table, deleteTarget.id);
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
      <ImportExportSection table={table} />
      
      {table === "localities" && <LocalityGeocodingSection />}
      {table === "parliaments" && <ParliamentGeocodingSection />}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All {displayName}s</h3>
          <ReferenceDataFormModal
            table={table}
            data={null}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Add {displayName}
              </Button>
            }
          />
        </div>
      </div>

      <DataTable emptyMessage={`No ${displayName.toLowerCase()}s found. Create your first one.`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                Name
              </th>
              {/* Hide code column for zones and villages (they don't have code column) */}
              {(table !== "zones" && table !== "villages") && (
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Code
                </th>
              )}
              {(table === "localities" || table === "polling_stations" || table === "zones" || table === "cawangan" || table === "villages" || table === "duns") && (
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  {table === "duns"
                    ? "Parliament"
                    : table === "localities" 
                    ? "Parliament / DUN" 
                    : table === "zones"
                    ? "DUN / Polling Station"
                    : table === "cawangan"
                    ? "Zone"
                    : table === "villages"
                    ? "Cawangan"
                    : "Locality"}
                </th>
              )}
              {table === "polling_stations" && (
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Address
                </th>
              )}
              {(table === "localities" || table === "parliaments") && (
                <>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Latitude
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Longitude
                  </th>
                </>
              )}
              {/* Hide status column for tables that don't have is_active (duns, zones, villages) */}
              {table !== "duns" && table !== "zones" && table !== "villages" && (
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.length === 0 ? (
              <DataTableEmpty
                colSpan={
                  table === "polling_stations" 
                    ? 6 
                    : table === "localities" || table === "parliaments"
                    ? 7 
                    : table === "zones" || table === "villages"
                    ? 3
                    : table === "duns" || table === "cawangan"
                    ? 5
                    : 4
                }
                message={`No ${displayName.toLowerCase()}s found. Create your first one.`}
              />
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>
                  {/* Hide code column for zones and villages (they don't have code column) */}
                  {(table !== "zones" && table !== "villages") && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {item.code || "-"}
                    </td>
                  )}
                  {(table === "localities" || table === "polling_stations" || table === "zones" || table === "cawangan" || table === "villages" || table === "duns") && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {table === "duns"
                        ? (item as any).parliament_name || "-"
                        : table === "localities"
                        ? `${(item as any).parliament_name || "-"} / ${(item as any).dun_name || "-"}`
                        : table === "zones"
                        ? `${(item as any).dun_name || "-"}${(item as any).polling_station_name ? ` / ${(item as any).polling_station_name}` : ""}`
                        : table === "cawangan"
                        ? (item as any).zone_name || "-"
                        : table === "villages"
                        ? (item as any).cawangan_name || "-"
                        : (item as any).locality_name || "-"}
                    </td>
                  )}
                  {table === "polling_stations" && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {(item as any).address || "-"}
                    </td>
                  )}
                  {(table === "localities" || table === "parliaments") && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {(item as any).lat !== null && (item as any).lat !== undefined
                          ? Number((item as any).lat).toFixed(6)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {(item as any).lng !== null && (item as any).lng !== undefined
                          ? Number((item as any).lng).toFixed(6)
                          : "-"}
                      </td>
                    </>
                  )}
                  {/* Hide status column for tables that don't have is_active (duns, zones, villages) */}
                  {table !== "duns" && table !== "zones" && table !== "villages" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (item.is_active ?? false)
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {(item.is_active ?? false) ? "Active" : "Inactive"}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ReferenceDataFormModal
                        table={table}
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
              Delete {displayName}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be
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
