"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { createBackup } from "@/lib/actions/backups";

export default function CreateBackupButton() {
  const t = useTranslations("backups");
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      alert(t("nameRequired"));
      return;
    }

    setIsCreating(true);
    try {
      const result = await createBackup(name.trim(), notes.trim() || undefined);
      if (result.success) {
        alert(t("createSuccess"));
        setShowModal(false);
        setName("");
        setNotes("");
        window.location.reload();
      } else {
        alert(result.error || t("createError"));
      }
    } catch (error) {
      alert(t("createError"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)} className="gap-2">
        <Database className="size-5" />
        <span>{t("createBackup")}</span>
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-background-dark rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{t("createBackup")}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("backupName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("backupNamePlaceholder")}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("notes")} <span className="text-gray-400">({t("optional")})</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  disabled={isCreating}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setName("");
                    setNotes("");
                  }}
                  disabled={isCreating}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {t("creating")}
                    </>
                  ) : (
                    t("create")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
