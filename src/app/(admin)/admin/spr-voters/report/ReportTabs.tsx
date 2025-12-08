"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Users } from "lucide-react";

type ReportTabsProps = {
  activeTab: string;
  versionId?: number;
};

export default function ReportTabs({ activeTab, versionId }: ReportTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", tab);
    if (versionId) {
      params.set("versionId", versionId.toString());
    }
    router.push(`/admin/spr-voters/report?${params.toString()}`);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <nav className="flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => handleTabChange("support")}
          className={`${
            activeTab === "support"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <BarChart3 className="size-4" />
          Support Report
        </button>
        <button
          onClick={() => handleTabChange("demographic")}
          className={`${
            activeTab === "demographic"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <Users className="size-4" />
          Demographic Report
        </button>
      </nav>
    </div>
  );
}
