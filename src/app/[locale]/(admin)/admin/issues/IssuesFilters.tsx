"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import Input from "@/components/ui/Input";
import IssueFormModalWrapper from "./IssueFormModalWrapper";
import { useEffect, useState } from "react";
import DateRangePicker, { type DateRange } from "@/components/ui/DateRangePicker";

import type { ReferenceData } from "@/lib/actions/reference-data";

type Props = {
  issueTypes: ReferenceData[];
  issueStatuses?: ReferenceData[];
};

export default function IssuesFilters({ issueTypes = [], issueStatuses = [] }: Props) {
  const t = useTranslations("issues.list");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state from URL params
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("category") || "");
  const [assignedFilter, setAssignedFilter] = useState(searchParams.get("assigned") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: searchParams.get("from") || undefined,
    end: searchParams.get("to") || undefined,
  });

  // Sync with URL changes
  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setTypeFilter(searchParams.get("category") || "");
    setAssignedFilter(searchParams.get("assigned") || "");
    setSearchQuery(searchParams.get("search") || "");
    setDateRange({
      start: searchParams.get("from") || undefined,
      end: searchParams.get("to") || undefined,
    });
  }, [searchParams]);

  const updateURL = (params: {
    status?: string;
    category?: string;
    assigned?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // Reset to page 1 on filter change
    newParams.delete("page");

    if (params.status !== undefined) {
      if (params.status) newParams.set("status", params.status);
      else newParams.delete("status");
    }

    if (params.category !== undefined) {
      if (params.category) newParams.set("category", params.category);
      else newParams.delete("category");
    }

    if (params.assigned !== undefined) {
      if (params.assigned) newParams.set("assigned", params.assigned);
      else newParams.delete("assigned");
    }

    if (params.search !== undefined) {
      if (params.search) newParams.set("search", params.search);
      else newParams.delete("search");
    }

    if (params.from !== undefined) {
      if (params.from) newParams.set("from", params.from);
      else newParams.delete("from");
    }

    if (params.to !== undefined) {
      if (params.to) newParams.set("to", params.to);
      else newParams.delete("to");
    }

    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    updateURL({ status: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTypeFilter(value);
    updateURL({ category: value });
  };

  const handleAssignedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAssignedFilter(value);
    updateURL({ assigned: value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateURL({ search: value });
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    updateURL({ from: range.start ?? "", to: range.end ?? "" });
  };

  const handleReset = () => {
    setStatusFilter("");
    setTypeFilter("");
    setAssignedFilter("");
    setSearchQuery("");
    setDateRange({});
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-9 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">{t("filters.status.label")}</option>
          {issueStatuses.length > 0 ? (
            issueStatuses
              .filter((status) => status.is_active !== false)
              .sort((a, b) => {
                const aOrder = (a as any).display_order || 0;
                const bOrder = (b as any).display_order || 0;
                return aOrder - bOrder;
              })
              .map((status) => (
                <option key={status.id} value={status.id.toString()}>
                  {status.name}
                </option>
              ))
          ) : (
            <>
              <option value="pending">{t("filters.status.new")}</option>
              <option value="in_progress">{t("filters.status.inProgress")}</option>
              <option value="resolved">{t("filters.status.resolved")}</option>
              <option value="closed">{t("filters.status.closed")}</option>
            </>
          )}
        </select>
        <select
          value={typeFilter}
          onChange={handleTypeChange}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">{t("filters.type.label")}</option>
          {issueTypes.map((type) => (
            <option key={type.id} value={type.id.toString()}>
              {type.name}
            </option>
          ))}
          {!issueTypes.length && (
            <>
              <option value="road_maintenance">{t("filters.type.infrastructure")}</option>
              <option value="drainage">{t("filters.type.utilities")}</option>
              <option value="sanitation">{t("filters.type.sanitation")}</option>
              <option value="public_safety">{t("filters.type.publicSafety")}</option>
              <option value="other">Other</option>
            </>
          )}
        </select>
        <select
          value={assignedFilter}
          onChange={handleAssignedChange}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">{t("filters.assigned.label")}</option>
          <option value="unassigned">{t("filters.assigned.unassigned")}</option>
          <option value="assigned">{t("filters.assigned.assigned") || "Assigned"}</option>
        </select>

        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          className="w-auto min-w-[240px]"
        />

        <button
          onClick={handleReset}
          className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          {t("filters.resetFilters")}
        </button>
        <IssueFormModalWrapper
          trigger={
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold hover:bg-primary/90 transition-colors">
              <Plus className="size-5" />
              <span>{t("newIssue")}</span>
            </button>
          }
        />
      </div>
    </div>
  );
}
