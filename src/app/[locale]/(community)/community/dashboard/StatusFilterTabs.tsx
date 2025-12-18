"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLoadingOverlay } from "@/hooks/useLoadingOverlay";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

type StatusFilterTabsProps = {
  currentFilter?: string;
  locale: string;
};

export default function StatusFilterTabs({ currentFilter, locale }: StatusFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoading } = useLoadingOverlay();
  const t = useTranslations("common");
  const tDashboard = useTranslations("communityDashboard");
  const previousSearchParams = useRef<string>("");
  const isLoadingRef = useRef(false);

  // Initialize previous search params on mount
  useEffect(() => {
    previousSearchParams.current = searchParams.toString();
  }, []);

  // Detect when search params change to hide loading overlay
  useEffect(() => {
    const currentParams = searchParams.toString();
    
    // If search params changed and we were loading, hide the overlay
    if (isLoadingRef.current && currentParams !== previousSearchParams.current) {
      // Small delay to ensure smooth transition
      const timeout = setTimeout(() => {
        setLoading(false);
        isLoadingRef.current = false;
      }, 100);
      
      previousSearchParams.current = currentParams;
      
      return () => clearTimeout(timeout);
    }
    
    // Update previous params even if not loading (for tracking)
    if (currentParams !== previousSearchParams.current) {
      previousSearchParams.current = currentParams;
    }
  }, [searchParams, setLoading]);

  const buildFilterUrl = (status?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    // Reset to page 1 when changing filter
    params.delete("page");
    const queryString = params.toString();
    return `/${locale}/community/dashboard${queryString ? `?${queryString}` : ""}`;
  };

  const handleTabClick = (status?: string) => {
    const url = buildFilterUrl(status);
    isLoadingRef.current = true;
    setLoading(true, t("loadingIssues"));
    router.push(url);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <nav className="flex gap-1 -mb-px min-w-max sm:min-w-0">
        <button
          onClick={() => handleTabClick()}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
            !currentFilter
              ? "text-primary border-primary"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
          }`}
        >
          {tDashboard("status.all")}
        </button>
        <button
          onClick={() => handleTabClick("pending")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
            currentFilter === "pending"
              ? "text-primary border-primary"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
          }`}
        >
          {tDashboard("status.pending")}
        </button>
        <button
          onClick={() => handleTabClick("in_progress")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
            currentFilter === "in_progress"
              ? "text-primary border-primary"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
          }`}
        >
          {tDashboard("status.inProgress")}
        </button>
        <button
          onClick={() => handleTabClick("resolved")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
            currentFilter === "resolved"
              ? "text-primary border-primary"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-primary hover:border-primary/50"
          }`}
        >
          {tDashboard("status.resolved")}
        </button>
      </nav>
    </div>
  );
}
