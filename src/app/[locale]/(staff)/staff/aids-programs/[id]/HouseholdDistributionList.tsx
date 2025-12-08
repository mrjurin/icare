"use client";

import { useState, useTransition, useEffect } from "react";
import { CheckCircle2, Circle, Search } from "lucide-react";
import Input from "@/components/ui/Input";
import {
  getProgramHouseholds,
  markHouseholdDistributed,
  unmarkHouseholdDistributed,
} from "@/lib/actions/aidsPrograms";

type HouseholdDistributionListProps = {
  programId: number;
  zoneId: number;
};

type Household = {
  id: number;
  head_name: string;
  address: string;
  received: boolean;
  marked_at: string | null;
};

export default function HouseholdDistributionList({
  programId,
  zoneId,
}: HouseholdDistributionListProps) {
  const [isPending, startTransition] = useTransition();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHouseholds = async () => {
      setLoading(true);
      const result = await getProgramHouseholds(programId, zoneId);
      if (result.success && result.data) {
        setHouseholds(result.data as Household[]);
      }
      setLoading(false);
    };
    loadHouseholds();
  }, [programId, zoneId]);

  const handleToggleDistribution = async (householdId: number, currentlyReceived: boolean) => {
    startTransition(async () => {
      let result;
      if (currentlyReceived) {
        result = await unmarkHouseholdDistributed(programId, householdId);
      } else {
        result = await markHouseholdDistributed(programId, householdId);
      }

      if (result.success) {
        // Update local state
        setHouseholds((prev) =>
          prev.map((h) =>
            h.id === householdId
              ? {
                  ...h,
                  received: !currentlyReceived,
                  marked_at: currentlyReceived ? null : new Date().toISOString(),
                }
              : h
          )
        );
      } else {
        alert(result.error || "Failed to update distribution status");
      }
    });
  };

  const filteredHouseholds = households.filter(
    (h) =>
      h.head_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const receivedCount = households.filter((h) => h.received).length;
  const totalCount = households.length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading households...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Progress</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {receivedCount}/{totalCount}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-800 dark:text-blue-200">Remaining</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {totalCount - receivedCount}
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (receivedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Household List */}
      <div className="space-y-2">
        {filteredHouseholds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "No households found" : "No households in this zone"}
            </p>
          </div>
        ) : (
          filteredHouseholds.map((household) => (
            <button
              key={household.id}
              onClick={() => handleToggleDistribution(household.id, household.received)}
              disabled={isPending}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                household.received
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                  : "bg-white dark:bg-background-dark border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {household.received ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold text-base ${
                      household.received
                        ? "text-green-900 dark:text-green-100"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {household.head_name}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      household.received
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {household.address}
                  </p>
                  {household.received && household.marked_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Marked: {new Date(household.marked_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Instructions:</strong> Tap on a household to mark it as distributed. Tap again to
          unmark if needed.
        </p>
      </div>
    </div>
  );
}
