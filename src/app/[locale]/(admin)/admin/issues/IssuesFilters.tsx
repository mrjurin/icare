"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import Input from "@/components/ui/Input";
import IssueFormModalWrapper from "./IssueFormModalWrapper";
import { useEffect, useState } from "react";

export default function IssuesFilters() {
  const t = useTranslations("issues.list");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  // Sync with URL changes (e.g., from map clicks)
  useEffect(() => {
    const status = searchParams.get("status") || "";
    setStatusFilter(status);
  }, [searchParams]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleReset = () => {
    setStatusFilter("");
    router.push(pathname, { scroll: false });
  };

  // Get the current status value for the dropdown
  const getStatusValue = (): string => {
    return statusFilter || "";
  };

  return (
    <div className="p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
          <Input placeholder={t("searchPlaceholder")} className="pl-9 w-full" />
        </div>
        <select
          value={getStatusValue()}
          onChange={handleStatusChange}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900"
        >
          <option value="">{t("filters.status.label")}</option>
          <option value="pending">{t("filters.status.new")}</option>
          <option value="in_progress">{t("filters.status.inProgress")}</option>
          <option value="resolved">{t("filters.status.resolved")}</option>
          <option value="closed">{t("filters.status.closed")}</option>
        </select>
        <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
          <option>{t("filters.type.label")}</option>
          <option>{t("filters.type.infrastructure")}</option>
          <option>{t("filters.type.utilities")}</option>
          <option>{t("filters.type.sanitation")}</option>
          <option>{t("filters.type.publicSafety")}</option>
        </select>
        <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
          <option>{t("filters.assigned.label")}</option>
          <option>{t("filters.assigned.unassigned")}</option>
          <option>{t("filters.assigned.teamA")}</option>
          <option>{t("filters.assigned.sanitationDept")}</option>
        </select>
        <Input asChild className="w-44">
          <input placeholder={t("filters.dateRange")} />
        </Input>
        <button
          onClick={handleReset}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white"
        >
          {t("filters.resetFilters")}
        </button>
        <IssueFormModalWrapper
          trigger={
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold">
              <Plus className="size-5" />
              <span>{t("newIssue")}</span>
            </button>
          }
        />
      </div>
    </div>
  );
}
