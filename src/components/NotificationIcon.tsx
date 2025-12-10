"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

interface NotificationIconProps {
  href: string;
  className?: string;
}

export default function NotificationIcon({ href, className = "" }: NotificationIconProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUnreadCount() {
      const result = await getUnreadNotificationCount();
      if (result.success && result.data !== undefined) {
        setUnreadCount(result.data);
      } else {
        // If unauthorized or error, hide the badge
        setUnreadCount(0);
      }
      setIsLoading(false);
    }

    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href={href}
      className={`relative inline-flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="size-5" />
      {!isLoading && unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
