"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type TabType = "household" | "spr";

interface DashboardTabsProps {
  defaultTab?: TabType;
  householdContent: React.ReactNode;
  sprContent: React.ReactNode;
}

export default function DashboardTabs({
  defaultTab = "household",
  householdContent,
  sprContent,
}: DashboardTabsProps) {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("household")}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
              ${
                activeTab === "household"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            {t("householdView")}
          </button>
          <button
            onClick={() => setActiveTab("spr")}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
              ${
                activeTab === "spr"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            {t("sprView")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "household" && householdContent}
        {activeTab === "spr" && sprContent}
      </div>
    </div>
  );
}
