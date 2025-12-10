"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { findRelatedMembers } from "@/lib/actions/households";
import ImprovedFamilyTreeView from "./ImprovedFamilyTreeView";

type Props = {
  householdId: number;
  trigger: React.ReactNode;
};

export default function FamilyTreeModal({ householdId, trigger }: Props) {
  const t = useTranslations("households.detail.tree");
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<{
    members: any[];
    households: any[];
  } | null>(null);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setError(null);

    const result = await findRelatedMembers(householdId);
    if (result.success && result.data) {
      setTreeData(result.data);
    } else {
      setError(result.error || "Failed to load family tree");
    }
    setIsLoading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setTreeData(null);
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Trigger asChild onClick={handleOpenModal}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="size-5" />
              {t("title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Loading family tree...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-center">
                {error}
              </div>
            ) : treeData ? (
              <ImprovedFamilyTreeView
                members={treeData.members}
                households={treeData.households}
                startingHouseholdId={householdId}
              />
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
