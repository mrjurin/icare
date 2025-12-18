"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Loader2, User, Home, MapPin, Users, Zap } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { searchHouseholdMembers, linkUserToHouseholdMember, linkUserToSprVoter } from "@/lib/actions/communityUsers";
import { searchSprVotersForLinking } from "@/lib/actions/memberships";
import { getVoterVersions } from "@/lib/actions/spr-voters";

type HouseholdMemberOption = {
  id: number;
  name: string;
  ic_number: string | null;
  household_id: number;
  household_name: string;
  household_address: string;
  zone_name: string | null;
};

type SprVoterOption = {
  id: number;
  version_id: number;
  no_kp: string | null;
  no_kp_lama: string | null;
  nama: string;
  no_hp: string | null;
  jantina: string | null;
  tarikh_lahir: string | null;
  bangsa: string | null;
  agama: string | null;
  alamat: string | null;
  poskod: string | null;
  daerah: string | null;
  kod_lokaliti: string | null;
  nama_parlimen: string | null;
  nama_dun: string | null;
  nama_lokaliti: string | null;
  nama_tm: string | null;
  saluran: number | null;
  voting_support_status: "white" | "black" | "red" | null;
  version: {
    id: number;
    name: string;
  };
};

type Props = {
  userId: number;
  userName: string;
  userIcNumber: string | null;
  userZoneId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TabType = "household" | "spr";

export default function LinkHouseholdModal({ userId, userName, userIcNumber, userZoneId, open, onOpenChange }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("household");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<HouseholdMemberOption[]>([]);
  const [sprVoters, setSprVoters] = useState<SprVoterOption[]>([]);
  const [versions, setVersions] = useState<Array<{ id: number; name: string; is_active: boolean }>>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedSprVoterId, setSelectedSprVoterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load SPR versions on mount
  useEffect(() => {
    if (open) {
      getVoterVersions().then((result) => {
        if (result.success && result.data) {
          setVersions(result.data);
          const activeVersion = result.data.find((v) => v.is_active);
          if (activeVersion) {
            setSelectedVersionId(activeVersion.id);
          }
        }
      });
    }
  }, [open]);

  // Search for household members when modal opens or search changes
  useEffect(() => {
    if (open && activeTab === "household") {
      if (search.length >= 2) {
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
      } else if (search.length === 0) {
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
      }
    }
  }, [open, search, userZoneId, activeTab]);

  // Search for SPR voters when modal opens or search changes
  useEffect(() => {
    if (open && activeTab === "spr") {
      if (search.length >= 2) {
        const timeoutId = setTimeout(() => {
          setLoading(true);
          setError(null);
          searchSprVotersForLinking({
            search,
            versionId: selectedVersionId,
            limit: 20,
          }).then((result) => {
            setLoading(false);
            if (result.success && result.data) {
              setSprVoters(result.data);
            } else {
              setError(result.error || "Failed to search SPR voters");
              setSprVoters([]);
            }
          });
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
      } else if (search.length === 0) {
        // Load initial SPR voters when modal opens
        setLoading(true);
        searchSprVotersForLinking({
          versionId: selectedVersionId,
          limit: 20,
        }).then((result) => {
          setLoading(false);
          if (result.success && result.data) {
            setSprVoters(result.data);
          } else {
            setError(result.error || "Failed to load SPR voters");
            setSprVoters([]);
          }
        });
      }
    }
  }, [open, search, selectedVersionId, activeTab]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setMembers([]);
      setSprVoters([]);
      setSelectedMemberId(null);
      setSelectedSprVoterId(null);
      setError(null);
      setActiveTab("household");
    }
  }, [open]);

  const handleSearchByIc = () => {
    if (!userIcNumber) {
      setError("No IC number available for this user");
      return;
    }

    // Set search to IC number
    setSearch(userIcNumber);
    setError(null);
    
    // The useEffect hooks will automatically trigger the search when search changes
  };

  const handleLink = () => {
    if (activeTab === "household") {
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
    } else if (activeTab === "spr") {
      if (!selectedSprVoterId) {
        setError("Please select an SPR voter");
        return;
      }

      setLinking(true);
      setError(null);
      startTransition(async () => {
        const result = await linkUserToSprVoter(userId, selectedSprVoterId);
        if (result.success) {
          onOpenChange(false);
          router.refresh();
        } else {
          setError(result.error || "Failed to link user to SPR voter");
          setLinking(false);
        }
      });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Link User to Data
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1 flex-1">
                  <p>
                    <strong>User:</strong> {userName}
                  </p>
                  {userIcNumber && (
                    <p>
                      <strong>IC Number:</strong> {userIcNumber}
                    </p>
                  )}
                </div>
                {userIcNumber && (
                  <button
                    onClick={handleSearchByIc}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-lg transition-colors whitespace-nowrap"
                    title="Search for this IC number in household and SPR data"
                  >
                    <Zap className="size-3" />
                    Search by IC
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setActiveTab("household");
                  setSearch("");
                  setSelectedMemberId(null);
                  setSelectedSprVoterId(null);
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "household"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="size-4" />
                  Household Members
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("spr");
                  setSearch("");
                  setSelectedMemberId(null);
                  setSelectedSprVoterId(null);
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "spr"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  SPR Voters
                </div>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {activeTab === "household" ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SPR Version
                  </label>
                  <select
                    value={selectedVersionId || ""}
                    onChange={(e) => setSelectedVersionId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Versions</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name} {version.is_active ? "(Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search SPR Voters
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, IC number, or address..."
                      className="pl-9 w-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Search by name, IC number (no_kp or no_kp_lama), or address to find SPR voters.
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Searching...</span>
                    </div>
                  ) : sprVoters.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Users className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {search.length >= 2
                          ? "No SPR voters found. Try a different search term."
                          : "Start typing to search for SPR voters."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sprVoters.map((voter) => (
                        <label
                          key={voter.id}
                          className={`block p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedSprVoterId === voter.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="spr_voter"
                              value={voter.id}
                              checked={selectedSprVoterId === voter.id}
                              onChange={() => setSelectedSprVoterId(voter.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Users className="size-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">{voter.nama}</span>
                                {voter.voting_support_status && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      voter.voting_support_status === "white"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : voter.voting_support_status === "black"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}
                                  >
                                    {voter.voting_support_status === "white"
                                      ? "White"
                                      : voter.voting_support_status === "black"
                                      ? "Black"
                                      : "Red"}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {voter.no_kp && <span>IC: {voter.no_kp}</span>}
                                {voter.no_kp_lama && <span>Old IC: {voter.no_kp_lama}</span>}
                                {voter.version && <span>Version: {voter.version.name}</span>}
                              </div>
                              {voter.alamat && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {voter.alamat}
                                  {voter.poskod && `, ${voter.poskod}`}
                                  {voter.daerah && `, ${voter.daerah}`}
                                </p>
                              )}
                              {voter.nama_dun && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  DUN: {voter.nama_dun}
                                  {voter.nama_parlimen && ` | Parliament: ${voter.nama_parlimen}`}
                                </p>
                              )}
                              {voter.nama_tm && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Polling Station: {voter.nama_tm}
                                  {voter.saluran && ` | Channel: ${voter.saluran}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={linking}>
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={
                  (activeTab === "household" && !selectedMemberId) ||
                  (activeTab === "spr" && !selectedSprVoterId) ||
                  linking ||
                  isPending
                }
              >
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
