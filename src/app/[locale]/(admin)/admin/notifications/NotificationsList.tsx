"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { BellPlus, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { markAllNotificationsAsRead } from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDisplay[]>(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-1 min-w-[320px]">
          <Input 
            placeholder="Search notifications..." 
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
            <option value="all">Type: All</option>
            <option value="new">New</option>
            <option value="status">Status</option>
            <option value="system">System</option>
            <option value="comment">Comment</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAsRead}
          >
            {isMarkingAsRead ? "Marking..." : "Mark all as read"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className={`rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between dark:bg-gray-800 dark:border-gray-700 ${n.unread ? "outline outline-2 outline-primary/60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-full flex items-center justify-center ${n.type === "new" ? "bg-primary/10 text-primary" : n.type === "status" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : n.type === "system" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                  <TypeIcon t={n.type} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{n.subtitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{n.timeAgo}</p>
                </div>
              </div>
              <div>
                {n.issueRef ? (
                  <Link 
                    href={`/admin/issues/${n.issueRef.replace(/^INC-/, "")}`} 
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    View Details
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">No linked item</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
