"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { BellPlus, CheckCircle2, AlertCircle, MessageSquare, Check, Trash2 } from "lucide-react";
import { markAllNotificationsAsRead, markNotificationAsRead, deleteNotification } from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type NotificationDisplay = {
  id: number;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: "new" | "status" | "system" | "comment";
  issueRef?: string;
  unread: boolean;
};

type NotificationsListProps = {
  notifications: NotificationDisplay[];
};

function TypeIcon({ t }: { t: NotificationDisplay["type"] }) {
  const classBase = "size-5";
  switch (t) {
    case "new":
      return <BellPlus className={classBase} />;
    case "status":
      return <CheckCircle2 className={classBase} />;
    case "system":
      return <AlertCircle className={classBase} />;
    case "comment":
      return <MessageSquare className={classBase} />;
  }
}

export default function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDisplay[]>(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch = 
        searchQuery === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || n.type === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [notifications, searchQuery, typeFilter]);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAsRead(true);
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, unread: false }))
      );
      router.refresh();
    }
    setIsMarkingAsRead(false);
  };

  const handleMarkAsRead = async (id: number) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    const result = await markNotificationAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      router.refresh();
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }
    setProcessingIds((prev) => new Set(prev).add(id));
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      router.refresh();
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-1 min-w-[320px]">
          <Input 
            placeholder={t("searchPlaceholder")} 
            className="flex-1" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">{t("typeFilter.all")}</option>
            <option value="new">{t("typeFilter.new")}</option>
            <option value="status">{t("typeFilter.status")}</option>
            <option value="system">{t("typeFilter.system")}</option>
            <option value="comment">{t("typeFilter.comment")}</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAsRead}
          >
            {isMarkingAsRead ? t("marking") : t("markAllAsRead")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("noNotificationsFound")}</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className={`rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between dark:bg-gray-800 dark:border-gray-700 ${n.unread ? "outline outline-2 outline-primary/60" : ""}`}>
              <div className="flex items-center gap-3 flex-1">
                <div className={`size-9 rounded-full flex items-center justify-center ${n.type === "new" ? "bg-primary/10 text-primary" : n.type === "status" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : n.type === "system" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                  <TypeIcon t={n.type} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{n.subtitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{n.timeAgo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {n.issueRef && (
                  <Link 
                    href={`/admin/issues/${n.issueRef.replace(/^INC-/, "")}`} 
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    {t("viewDetails")}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {n.unread && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={processingIds.has(n.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={t("markAsRead")}
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={processingIds.has(n.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
