"use client";

import { Link, usePathname } from "@/i18n/routing";
import { ScrollText, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AuditLogsTabs() {
  const t = useTranslations("auditLogs");
  const pathname = usePathname();

  const tabs = [
    {
      href: "/admin/audit-logs",
      label: t("tabs.logs"),
      icon: ScrollText,
      isActive: pathname === "/admin/audit-logs" || (pathname.startsWith("/admin/audit-logs") && !pathname.includes("/reports")),
    },
    {
      href: "/admin/audit-logs/reports",
      label: t("tabs.reports"),
      icon: BarChart3,
      isActive: pathname === "/admin/audit-logs/reports" || pathname.startsWith("/admin/audit-logs/reports"),
    },
  ];

  return (
    <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab.isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
