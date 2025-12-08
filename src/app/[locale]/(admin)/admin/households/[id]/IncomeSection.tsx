"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Edit2, Plus, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { upsertIncome, type HouseholdIncome } from "@/lib/actions/households";

type Props = {
  householdId: number;
  income: HouseholdIncome[];
};

export default function IncomeSection({ householdId, income }: Props) {
  const t = useTranslations("households.detail.income");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestIncome = income && income.length > 0 ? income[0] : null;

  const [formData, setFormData] = useState({
    monthlyIncome: latestIncome?.monthly_income?.toString() || "",
    incomeSource: latestIncome?.income_source || "",
    numberOfIncomeEarners: latestIncome?.number_of_income_earners?.toString() || "0",
    notes: latestIncome?.notes || "",
  });

  const handleOpenModal = () => {
    setFormData({
      monthlyIncome: latestIncome?.monthly_income?.toString() || "",
      incomeSource: latestIncome?.income_source || "",
      numberOfIncomeEarners: latestIncome?.number_of_income_earners?.toString() || "0",
      notes: latestIncome?.notes || "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await upsertIncome({
        householdId,
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        incomeSource: formData.incomeSource || undefined,
        numberOfIncomeEarners: parseInt(formData.numberOfIncomeEarners, 10) || 0,
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
            <DollarSign className="size-5" />
            {t("title")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {latestIncome
              ? t("lastUpdated", { date: new Date(latestIncome.last_updated).toLocaleDateString() })
              : t("noIncome")}
          </p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          {latestIncome ? (
            <>
              <Edit2 className="size-4" />
              {t("updateIncome")}
            </>
          ) : (
            <>
              <Plus className="size-4" />
              {t("addIncomeInfo")}
            </>
          )}
        </Button>
      </div>

      {latestIncome ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">{t("monthlyIncome")}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              RM {latestIncome.monthly_income?.toLocaleString() || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("incomeSource")}</p>
            <p className="font-medium text-gray-900 mt-1">{latestIncome.income_source || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("numberOfIncomeEarners")}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {latestIncome.number_of_income_earners || 0}
            </p>
          </div>
          {latestIncome.notes && (
            <div className="md:col-span-3">
              <p className="text-sm text-gray-600">{t("notes")}</p>
              <p className="font-medium text-gray-900 mt-1">{latestIncome.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="size-12 mx-auto mb-3 text-gray-400" />
          <p>{t("noIncomeRecorded")}</p>
        </div>
      )}

      {/* Income History */}
      {income && income.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("incomeHistory")}</h3>
          <div className="space-y-2">
            {income.slice(1, 6).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    RM {record.monthly_income?.toLocaleString() || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.income_source || t("noSourceSpecified")} •{" "}
                    {new Date(record.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income Form Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {latestIncome ? t("modal.updateTitle") : t("modal.addTitle")}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.monthlyIncome")}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  placeholder={t("modal.monthlyIncomePlaceholder")}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.incomeSource")}
                </label>
                <select
                  value={formData.incomeSource}
                  onChange={(e) => setFormData({ ...formData, incomeSource: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="">{t("modal.selectSource")}</option>
                  <option value="Employment">{t("sources.employment")}</option>
                  <option value="Business">{t("sources.selfEmployed")}</option>
                  <option value="Pension">{t("sources.pension")}</option>
                  <option value="Government Aid">{t("sources.governmentAid")}</option>
                  <option value="Family Support">{t("sources.other")}</option>
                  <option value="Other">{t("sources.other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.numberOfIncomeEarners")}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.numberOfIncomeEarners}
                  onChange={(e) => setFormData({ ...formData, numberOfIncomeEarners: e.target.value })}
                  className="w-full"
                />
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
                  placeholder="Additional notes about income..."
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
                    <DollarSign className="size-4" />
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
