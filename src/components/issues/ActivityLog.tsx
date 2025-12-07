import { Flag, User, PlusCircle, RefreshCw, MessageSquare } from "lucide-react";

export type ActivityItem = {
  kind: "created" | "status_change" | "assigned" | "comment";
  date: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
};

const ICON_MAP = {
  created: { icon: PlusCircle, cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" },
  status_change: { icon: RefreshCw, cls: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" },
  assigned: { icon: User, cls: "bg-primary/20 text-primary" },
  comment: { icon: MessageSquare, cls: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" },
};

export default function ActivityLog({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {activities.map((ev, i) => {
        const iconConfig = ICON_MAP[ev.kind] || ICON_MAP.created;
        const Icon = iconConfig.icon;
        const isLast = i === activities.length - 1;

        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center size-8 rounded-full shrink-0 ${iconConfig.cls}`}
              >
                <Icon className="size-4" />
              </div>
              {!isLast && (
                <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 my-2 min-h-[16px]"></div>
              )}
            </div>
            <div className="pb-2">
              <p className="text-sm text-gray-900 dark:text-white">{ev.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(ev.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {ev.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{ev.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
