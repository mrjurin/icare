"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Pencil, Trash2, Power, Search, UserCog, Crown, User, Shield, MapPin, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import type { PaginationProps } from "@/components/ui/Pagination";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { deleteStaff, toggleStaffStatus, type Staff, type StaffRole } from "@/lib/actions/staff";
import StaffPermissionsModal from "./StaffPermissionsModal";
import StaffFormModal from "./StaffFormModal";
import { useTranslations } from "next-intl";

function RoleBadge({ role, t }: { role: StaffRole; t: any }) {
  const ROLE_CONFIG: Record<StaffRole, { labelKey: string; icon: typeof Crown; cls: string }> = {
    adun: { labelKey: "adun", icon: Crown, cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" },
    super_admin: { labelKey: "superAdmin", icon: Shield, cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" },
    zone_leader: { labelKey: "zoneLeader", icon: MapPin, cls: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    staff_manager: { labelKey: "manager", icon: UserCog, cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
    staff: { labelKey: "staff", icon: User, cls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  };
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.staff;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.cls}`}>
      <Icon className="size-3" />
      {t(`roles.${config.labelKey}`)}
    </span>
  );
}

function StatusBadge({ status, t }: { status: "active" | "inactive"; t: any }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
      }`}
    >
      {status === "active" ? t("table.active") : t("table.inactive")}
    </span>
  );
}

export default function StaffTable({
  staffList,
  pagination,
}: {
  staffList: Staff[];
  pagination?: PaginationProps | null;
}) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateFilters = (newSearch?: string, newRole?: string, newStatus?: string, resetPage = true) => {
    const params = new URLSearchParams();
    const finalSearch = newSearch !== undefined ? newSearch : search;
    const finalRole = newRole !== undefined ? newRole : roleFilter;
    const finalStatus = newStatus !== undefined ? newStatus : statusFilter;
    
    if (finalSearch) params.set("search", finalSearch);
    if (finalRole) params.set("role", finalRole);
    if (finalStatus) params.set("status", finalStatus);
    
    // Reset to page 1 when filters change (unless explicitly told not to)
    if (resetPage && searchParams.get("page")) {
      // Page will be removed, effectively resetting to page 1
    }
    
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRoleFilter(newRole);
    updateFilters(undefined, newRole, undefined);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    updateFilters(undefined, undefined, newStatus);
  };

  const handleReset = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    router.push(pathname); // This will clear all params including page
  };

  const handleToggleStatus = async (staff: Staff) => {
    startTransition(async () => {
      await toggleStaffStatus(staff.id);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteStaff(deleteTarget.id);
      if (!result.success) {
        alert(result.error);
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder={t("table.searchPlaceholder")}
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t("table.role")}</label>
          <select
            className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            value={roleFilter}
              onChange={handleRoleChange}
          >
              <option value="">{t("table.all")}</option>
            <option value="adun">{t("roles.adun")}</option>
            <option value="super_admin">{t("roles.superAdmin")}</option>
            <option value="zone_leader">{t("roles.zoneLeader")}</option>
            <option value="staff_manager">{t("roles.manager")}</option>
            <option value="staff">{t("roles.staff")}</option>
          </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t("table.status")}</label>
          <select
            className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            value={statusFilter}
              onChange={handleStatusChange}
          >
              <option value="">{t("table.all")}</option>
            <option value="active">{t("table.active")}</option>
            <option value="inactive">{t("table.inactive")}</option>
          </select>
          </div>
          <Button variant="outline" onClick={handleSearch}>
            {t("table.search")}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            {t("table.reset")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        pagination={pagination || undefined}
        emptyMessage={t("table.noStaffFound")}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.name")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.contact")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.role")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.position")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.zone")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                {t("table.status")}
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <DataTableEmpty
                colSpan={7}
                message={t("table.noStaffFound")}
              />
            ) : (
              staffList.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{s.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.email && <div className="text-gray-900 dark:text-white">{s.email}</div>}
                    {(s as any).ic_number && (
                      <div className="text-gray-700 dark:text-gray-300 text-sm">
                        {t("table.icNumber")} {(s as any).ic_number}
                      </div>
                    )}
                    {!s.email && !(s as any).ic_number && (
                      <div className="text-gray-400 dark:text-gray-500 text-sm italic">{t("table.noIdentifier")}</div>
                    )}
                    {s.phone && <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{s.phone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={s.role} t={t} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {s.position || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {s.role === "zone_leader" && s.zone_id ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="size-3" />
                        {t("table.zoneNumber", { id: s.zone_id })}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={s.status} t={t} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <StaffPermissionsModal
                        staff={s}
                        trigger={
                          <button
                            title={t("table.managePermissions")}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <ShieldCheck className="size-4" />
                          </button>
                        }
                      />
                      <StaffFormModal
                        staff={s}
                        trigger={
                          <button
                            title={t("table.edit")}
                            className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Pencil className="size-4" />
                          </button>
                        }
                      />
                      <button
                        title={s.status === "active" ? t("table.deactivate") : t("table.activate")}
                        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          s.status === "active"
                            ? "text-gray-500 hover:text-orange-600"
                            : "text-gray-500 hover:text-green-600"
                        }`}
                        onClick={() => handleToggleStatus(s)}
                        disabled={isPending}
                      >
                        <Power className="size-4" />
                      </button>
                      <button
                        title={t("table.delete")}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setDeleteTarget(s)}
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
      <AlertDialog.Root open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {t("table.deleteTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("table.deleteConfirm", { name: deleteTarget?.name || "" })}
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
                  {t("table.delete")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
