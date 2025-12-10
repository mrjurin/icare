"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Loader2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { upsertIncome } from "@/lib/actions/households";

type Props = {
  householdId: number;
  trigger: React.ReactNode;
  currentIncome?: number | null;
};

export default function QuickAddIncomeModal({ householdId, trigger, currentIncome }: Props) {
  const t = useTranslations("households.detail.income");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    monthlyIncome: currentIncome?.toString() || "",
    incomeSource: "",
    numberOfIncomeEarners: "0",
    notes: "",
  });

  const handleOpenModal = () => {
    setFormData({
      monthlyIncome: currentIncome?.toString() || "",
      incomeSource: "",
      numberOfIncomeEarners: "0",
      notes: "",
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
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Trigger asChild onClick={handleOpenModal}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="size-5" />
              {currentIncome ? t("modal.updateTitle") : t("modal.addTitle")}
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
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <DollarSign className="size-4" />}
                {currentIncome ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
