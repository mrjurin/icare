"use client";

import { useState, useEffect } from "react";
import { Search, X, Users } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Input from "@/components/ui/Input";
import { getProgramHouseholds } from "@/lib/actions/aidsPrograms";
import { useTranslations } from "next-intl";

type RecipientsModalProps = {
  programId: number;
  zoneId: number;
  zoneName?: string;
  villageName?: string;
  trigger: React.ReactNode;
};

type Household = {
  id: number;
  head_name: string;
  address: string;
  received: boolean;
  marked_at: string | null;
  marked_by: number | null;
};

export default function RecipientsModal({
  programId,
  zoneId,
  zoneName,
  villageName,
  trigger,
}: RecipientsModalProps) {
  const t = useTranslations("aidsPrograms.detail");
  const [isOpen, setIsOpen] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadHouseholds = async () => {
        setLoading(true);
        const result = await getProgramHouseholds(programId, zoneId);
        if (result.success && result.data) {
          setHouseholds(result.data as Household[]);
        }
        setLoading(false);
      };
      loadHouseholds();
    }
  }, [isOpen, programId, zoneId]);

  const filteredHouseholds = households.filter(
    (h) =>
      h.head_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const receivedCount = households.filter((h) => h.received).length;
  const totalCount = households.length;

  const displayName = villageName ? `${zoneName} - ${villageName}` : zoneName || "Zone";

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="size-5" />
              {t("recipients") || "Recipients"} - {displayName}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {t("totalRecipients") || "Total Recipients"}
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {receivedCount}/{totalCount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t("remaining") || "Remaining"}
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {totalCount - receivedCount}
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (receivedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t("searchRecipients") || "Search by name or address..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Recipients List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading") || "Loading recipients..."}
                </p>
              </div>
            ) : filteredHouseholds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? t("noRecipientsFound") || "No recipients found"
                    : t("noRecipients") || "No recipients in this zone"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHouseholds.map((household) => (
                  <div
                    key={household.id}
                    className={`p-4 rounded-lg border-2 ${
                      household.received
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-white dark:bg-background-dark border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {household.received ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-base ${
                            household.received
                              ? "text-green-900 dark:text-green-100"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {household.head_name}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            household.received
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {household.address}
                        </p>
                        {household.received && household.marked_at && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {t("markedAt") || "Marked"}:{" "}
                            {new Date(household.marked_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
