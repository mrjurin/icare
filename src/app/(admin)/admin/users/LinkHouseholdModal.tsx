"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Loader2, User, Home, MapPin } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { searchHouseholdMembers, linkUserToHouseholdMember } from "@/lib/actions/communityUsers";

type HouseholdMemberOption = {
  id: number;
  name: string;
  ic_number: string | null;
  household_id: number;
  household_name: string;
  household_address: string;
  zone_name: string | null;
};

type Props = {
  userId: number;
  userName: string;
  userZoneId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function LinkHouseholdModal({ userId, userName, userZoneId, open, onOpenChange }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<HouseholdMemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search for household members when modal opens or search changes
  useEffect(() => {
    if (open && search.length >= 2) {
      const timeoutId = setTimeout(() => {
        setLoading(true);
        setError(null);
        searchHouseholdMembers({
          search,
          zoneId: userZoneId || undefined,
          limit: 20,
        }).then((result) => {
          setLoading(false);
          if (result.success && result.data) {
            setMembers(result.data);
          } else {
            setError(result.error || "Failed to search household members");
            setMembers([]);
          }
        });
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else if (open && search.length === 0) {
      // Load initial members when modal opens
      setLoading(true);
      searchHouseholdMembers({
        zoneId: userZoneId || undefined,
        limit: 20,
      }).then((result) => {
        setLoading(false);
        if (result.success && result.data) {
          setMembers(result.data);
        } else {
          setError(result.error || "Failed to load household members");
          setMembers([]);
        }
      });
    } else if (!open) {
      // Reset when modal closes
      setSearch("");
      setMembers([]);
      setSelectedMemberId(null);
      setError(null);
    }
  }, [open, search, userZoneId]);

  const handleLink = () => {
    if (!selectedMemberId) {
      setError("Please select a household member");
      return;
    }

    setLinking(true);
    setError(null);
    startTransition(async () => {
      const result = await linkUserToHouseholdMember(userId, selectedMemberId);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to link user to household member");
        setLinking(false);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Link User to Household Member
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>User:</strong> {userName}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Household Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or IC number..."
                  className="pl-9 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {userZoneId
                  ? "Showing members from the same zone. Search by name or IC number."
                  : "Search by name or IC number to find household members."}
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="size-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Searching...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <User className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {search.length >= 2
                      ? "No household members found. Try a different search term."
                      : "Start typing to search for household members."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className={`block p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedMemberId === member.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="household_member"
                          value={member.id}
                          checked={selectedMemberId === member.id}
                          onChange={() => setSelectedMemberId(member.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                          </div>
                          {member.ic_number && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              IC: {member.ic_number}
                            </p>
                          )}
                          <div className="mt-2 flex items-start gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Home className="size-3" />
                              <span>{member.household_name}</span>
                            </div>
                            {member.zone_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                <span>{member.zone_name}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {member.household_address}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={linking}>
                Cancel
              </Button>
              <Button onClick={handleLink} disabled={!selectedMemberId || linking || isPending}>
                {linking || isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  "Link User"
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
