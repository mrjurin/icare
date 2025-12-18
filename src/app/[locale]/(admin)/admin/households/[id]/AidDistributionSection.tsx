"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createAidDistribution, type AidDistribution, type ProgramAidDistribution } from "@/lib/actions/households";
import { getActiveStaff, type Staff } from "@/lib/actions/staff";
import Link from "next/link";

type Props = {
  householdId: number;
  membersAtHome: number;
  totalDependents: number;
  distributions: AidDistribution[];
  programDistributions: ProgramAidDistribution[];
};

export default function AidDistributionSection({
  householdId,
  membersAtHome,
  totalDependents,
  distributions,
  programDistributions = [],
}: Props) {
  const t = useTranslations("households.detail.aidDistribution");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [formData, setFormData] = useState({
    aidType: "",
    quantity: "1",
    distributedTo: membersAtHome.toString(),
    distributedBy: "",
    notes: "",
  });

  useEffect(() => {
    // Load staff list for distribution by field
    getActiveStaff().then((result) => {
      if (result.success && result.data) {
        setStaffList(result.data);
      }
    });
  }, []);

  const handleOpenModal = () => {
    setFormData({
      aidType: "",
      quantity: "1",
      distributedTo: membersAtHome.toString(),
      distributedBy: "",
      notes: "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const distributedToNum = parseInt(formData.distributedTo, 10);
    if (distributedToNum < 1) {
      setError(t("modal.validationError"));
      return;
    }

    if (distributedToNum > membersAtHome) {
      if (
        !confirm(
          t("modal.warning", { distributed: distributedToNum, atHome: membersAtHome })
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      const result = await createAidDistribution({
        householdId,
        aidType: formData.aidType,
        quantity: parseInt(formData.quantity, 10) || 1,
        distributedTo: distributedToNum,
        distributedBy: formData.distributedBy ? parseInt(formData.distributedBy, 10) : undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        setIsModalOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="size-5" />
            {t("title")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("description", { count: membersAtHome })}
          </p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="size-4" />
          {t("recordDistribution")}
        </Button>
      </div>

      {/* Info Alert */}
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">{t("guidelines.title")}</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>{t("guidelines.membersAtHome", { count: membersAtHome })}</li>
              <li>{t("guidelines.totalDependents", { count: totalDependents })}</li>
              <li>{t("guidelines.makeSure", { count: membersAtHome })}</li>
            </ul>
          </div>
        </div>
      </div>

      {distributions.length === 0 && programDistributions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="size-12 mx-auto mb-3 text-gray-400" />
          <p>{t("noDistributions")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Regular Aid Distributions */}
          {distributions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("regularDistributions") || "Regular Distributions"}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.date")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.aidType")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.quantity")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                        {t("table.distributedTo")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.status")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((distribution) => {
                      const isComplete = distribution.distributed_to >= membersAtHome;
                      return (
                        <tr key={distribution.id} className="border-t border-gray-200">
                          <td className="px-4 py-3">
                            {new Date(distribution.distribution_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium">{distribution.aid_type}</td>
                          <td className="px-4 py-3">{distribution.quantity}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{distribution.distributed_to}</span>
                              <span className="text-gray-500">/ {membersAtHome}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isComplete ? (
                              <div className="flex items-center gap-1.5 text-green-700">
                                <CheckCircle className="size-4" />
                                <span className="text-xs font-medium">{t("table.complete")}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-orange-700">
                                <AlertCircle className="size-4" />
                                <span className="text-xs font-medium">{t("table.partial")}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {distribution.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Program-Based Aid Distributions */}
          {programDistributions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("programDistributions") || "Program Distributions"}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.date")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.program") || "Program"}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.aidType")}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.markedBy") || "Marked By"}</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programDistributions.map((distribution) => (
                      <tr key={distribution.id} className="border-t border-gray-200">
                        <td className="px-4 py-3">
                          {new Date(distribution.marked_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {distribution.program_name ? (
                            <Link
                              href={`/admin/aids-programs/${distribution.program_id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {distribution.program_name}
                            </Link>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{distribution.program_aid_type || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {distribution.marked_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {distribution.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distribution Form Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {t("modal.title")}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>{t("modal.membersAtHome")}</strong> {membersAtHome} • <strong>{t("modal.dependents")}</strong>{" "}
                  {totalDependents}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.aidType")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.aidType}
                  onChange={(e) => setFormData({ ...formData, aidType: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  required
                >
                  <option value="">{t("modal.selectAidType")}</option>
                  <option value="Food Basket">{t("types.foodBasket")}</option>
                  <option value="Cash Aid">{t("types.cashAid")}</option>
                  <option value="Medical Supplies">{t("types.medicalSupplies")}</option>
                  <option value="Clothing">{t("types.clothing")}</option>
                  <option value="School Supplies">{t("types.schoolSupplies")}</option>
                  <option value="Other">{t("types.other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.quantity")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.distributedTo")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max={membersAtHome + 10} // Allow some flexibility
                  value={formData.distributedTo}
                  onChange={(e) => setFormData({ ...formData, distributedTo: e.target.value })}
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended: {membersAtHome} (all members at home)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.distributedBy")}
                </label>
                <select
                  value={formData.distributedBy}
                  onChange={(e) => setFormData({ ...formData, distributedBy: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="">{t("modal.selectStaff")}</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id.toString()}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.notes")}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="Additional notes about this distribution..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    {t("modal.cancel")}
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Package className="size-4" />
                  )}
                  {t("modal.save")}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
