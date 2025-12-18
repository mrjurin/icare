"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

type Zone = {
  id: number;
  name: string;
};

type AidProgram = {
  id: number;
  name: string;
};

type HouseholdFiltersProps = {
  zones: Zone[];
  aidsPrograms: AidProgram[];
  years: number[];
  searchPlaceholder: string;
  allZonesLabel: string;
  allAidProgramsLabel: string;
  allYearsLabel: string;
  resetFiltersLabel: string;
};

export default function HouseholdFilters({
  zones,
  aidsPrograms,
  years,
  searchPlaceholder,
  allZonesLabel,
  allAidProgramsLabel,
  allYearsLabel,
  resetFiltersLabel,
}: HouseholdFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const area = searchParams.get("area") || "";
  const aidProgram = searchParams.get("aidProgram") || "";
  const year = searchParams.get("year") || "";

  const handleFilterChange = () => {
    startTransition(() => {
      const form = document.getElementById("household-filters-form") as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        const searchValue = formData.get("search") as string;
        const areaValue = formData.get("area") as string;
        const aidProgramValue = formData.get("aidProgram") as string;
        const yearValue = formData.get("year") as string;

        if (searchValue) params.set("search", searchValue);
        if (areaValue) params.set("area", areaValue);
        if (aidProgramValue) params.set("aidProgram", aidProgramValue);
        if (yearValue) params.set("year", yearValue);

        router.push(`/admin/households${params.toString() ? `?${params.toString()}` : ""}`);
      }
    });
  };

  const hasActiveFilters = search || area || aidProgram || year;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <form
            id="household-filters-form"
            method="get"
            action="/admin/households"
            className="flex flex-wrap items-center gap-3 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              handleFilterChange();
            }}
          >
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
              <Input
                name="search"
                placeholder={searchPlaceholder}
                defaultValue={search}
                className="pl-9 w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFilterChange();
                  }
                }}
              />
            </div>
            <select
              name="area"
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              defaultValue={area}
              onChange={handleFilterChange}
            >
              <option value="">{allZonesLabel}</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.name}>
                  {zone.name}
                </option>
              ))}
            </select>
            <select
              name="aidProgram"
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              defaultValue={aidProgram}
              onChange={handleFilterChange}
            >
              <option value="">{allAidProgramsLabel}</option>
              {aidsPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            <select
              name="year"
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              defaultValue={year}
              onChange={handleFilterChange}
            >
              <option value="">{allYearsLabel}</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Link href="/admin/households">
                <Button type="button" variant="outline" disabled={isPending}>
                  {resetFiltersLabel}
                </Button>
              </Link>
            )}
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>
      </div>
      <div className="h-px bg-gray-200" />
    </div>
  );
}
