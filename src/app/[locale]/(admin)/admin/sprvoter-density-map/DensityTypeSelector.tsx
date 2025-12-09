"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as Select from "@radix-ui/react-select";

type DensityType = "voter_address" | "locality_location";

export default function DensityTypeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = (searchParams.get("densityType") || "voter_address") as DensityType;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("densityType", value);
    // Preserve versionId if it exists
    const versionId = searchParams.get("versionId");
    if (versionId) {
      params.set("versionId", versionId);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Density Based On:
      </label>
      <Select.Root value={currentType} onValueChange={handleChange}>
        <Select.Trigger className="inline-flex items-center justify-between h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark px-3 text-sm text-gray-900 dark:text-white min-w-[200px]">
          <Select.Value />
          <span className="ml-2 text-gray-500">▾</span>
        </Select.Trigger>
        <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark shadow-md">
          <Select.Viewport className="p-1">
            <Select.Item
              value="voter_address"
              className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
            >
              <Select.ItemText>Voter Address Location</Select.ItemText>
            </Select.Item>
            <Select.Item
              value="locality_location"
              className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
            >
              <Select.ItemText>Locality Location</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Root>
    </div>
  );
}
