"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2, RotateCcw, Calendar, User, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Backup } from "@/lib/actions/backups";
import { deleteBackup, restoreBackup, getBackupData } from "@/lib/actions/backups";
// Simple date formatting function
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

type Props = {
  backups: Backup[];
};

export default function BackupsTable({ backups }: Props) {
  const t = useTranslations("backups");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteBackup(id);
      if (!result.success) {
        alert(result.error || t("deleteError"));
      }
    } catch (error) {
      alert(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (backup: Backup) => {
    setDownloadingId(backup.id);
    try {
      const result = await getBackupData(backup.id);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = backup.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(result.error || t("downloadError"));
      }
    } catch (error) {
      alert(t("downloadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm(t("confirmRestore"))) {
      setShowRestoreConfirm(null);
      return;
    }

    setRestoringId(id);
    try {
      const result = await restoreBackup(id, true);
      if (result.success) {
        alert(t("restoreSuccess"));
        window.location.reload();
      } else {
        alert(result.error || t("restoreError"));
      }
    } catch (error) {
      alert(t("restoreError"));
    } finally {
      setRestoringId(null);
      setShowRestoreConfirm(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return t("unknownSize");
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="size-4 text-green-500" />;
      case "failed":
        return <XCircle className="size-4 text-red-500" />;
      case "pending":
        return <Clock className="size-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return t("statusCompleted");
      case "failed":
        return t("statusFailed");
      case "pending":
        return t("statusPending");
      default:
        return status;
    }
  };

  if (backups.length === 0) {
    return (
      <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <FileText className="size-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t("noBackups")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("size")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("createdAt")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="size-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {backup.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {backup.file_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(backup.status)}
                    <span className="text-sm text-gray-900 dark:text-white">
                      {getStatusLabel(backup.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(backup.file_size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="size-4 mr-2" />
                    {formatDistanceToNow(new Date(backup.created_at))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {backup.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(backup)}
                          disabled={downloadingId === backup.id}
                          className="gap-2 h-9 text-xs"
                        >
                          <Download className="size-4" />
                          {downloadingId === backup.id ? t("downloading") : t("download")}
                        </Button>
                        {showRestoreConfirm === backup.id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleRestore(backup.id)}
                              disabled={restoringId === backup.id}
                              className="gap-2 h-9 text-xs text-orange-600 hover:text-orange-700"
                            >
                              <RotateCcw className="size-4" />
                              {restoringId === backup.id ? t("restoring") : t("confirmRestore")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowRestoreConfirm(null)}
                              className="h-9 text-xs"
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setShowRestoreConfirm(backup.id)}
                            disabled={restoringId === backup.id}
                            className="gap-2 h-9 text-xs text-orange-600 hover:text-orange-700"
                          >
                            <RotateCcw className="size-4" />
                            {t("restore")}
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(backup.id)}
                      disabled={deletingId === backup.id}
                      className="gap-2 h-9 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                      {deletingId === backup.id ? t("deleting") : t("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
