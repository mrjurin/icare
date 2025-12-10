"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Home, Save, FileText, UserPlus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createHousehold,
  updateHousehold,
  type Household,
  type CreateHouseholdInput,
} from "@/lib/actions/households";
import { getZones, type Zone } from "@/lib/actions/zones";
import { getVotersList, getVoterVersions, type SprVoter, type SprVoterVersion } from "@/lib/actions/spr-voters";

type TabType = "new" | "spr";

type Props = {
  trigger: ReactNode;
  household?: Household;
};

export default function HouseholdFormModal({ trigger, household }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("new");

  // SPR voters
  const [sprVoters, setSprVoters] = useState<SprVoter[]>([]);
  const [loadingSpr, setLoadingSpr] = useState(false);
  const [sprSearchQuery, setSprSearchQuery] = useState("");
  const [sprVersions, setSprVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);

  const isEdit = !!household;

  const [selectedSprVoterId, setSelectedSprVoterId] = useState<number | undefined>(undefined);

  const [formData, setFormData] = useState<CreateHouseholdInput>({
    headName: household?.head_name || "",
    headIcNumber: household?.head_ic_number || "",
    headPhone: household?.head_phone || "",
    address: household?.address || "",
    area: household?.area || "",
    zoneId: (household as any)?.zone_id || undefined,
    notes: household?.notes || "",
  });

  // Fetch zones and SPR versions when modal opens
  useEffect(() => {
    if (open) {
      getZones().then((result) => {
        if (result.success && result.data) {
          setZones(result.data);
        }
      });
      if (!isEdit) {
        getVoterVersions().then((result) => {
          if (result.success && result.data) {
            setSprVersions(result.data);
            const activeVersion = result.data.find((v) => v.is_active);
            if (activeVersion) {
              setSelectedVersionId(activeVersion.id);
            }
          }
        });
      }
    }
  }, [open, isEdit]);

  // Load SPR voters when tab changes or version changes
  useEffect(() => {
    if (open && activeTab === "spr" && !isEdit) {
      loadSprVoters();
    }
  }, [open, activeTab, selectedVersionId, isEdit]);

  const loadSprVoters = async () => {
    setLoadingSpr(true);
    setError(null);
    const result = await getVotersList({ 
      limit: 100,
      versionId: selectedVersionId,
      search: sprSearchQuery || undefined,
    });
    if (result.success && result.data) {
      setSprVoters(result.data.data || []);
    } else {
      setError(result.error || "Failed to load SPR voters");
      setSprVoters([]);
    }
    setLoadingSpr(false);
  };

  const handleSearchSpr = () => {
    loadSprVoters();
  };

  const filteredSprVoters = sprVoters.filter((voter) =>
    voter.nama.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
    voter.no_kp?.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
    voter.alamat?.toLowerCase().includes(sprSearchQuery.toLowerCase())
  );

  const handleSelectSprVoter = (voter: SprVoter) => {
    setSelectedSprVoterId(voter.id);
    setFormData({
      headName: voter.nama || "",
      headIcNumber: voter.no_kp || "",
      headPhone: voter.no_hp || "",
      address: voter.alamat || voter.no_rumah || "",
      area: household?.area || "",
      zoneId: (household as any)?.zone_id || undefined,
      notes: household?.notes || "",
      headOfHouseholdId: voter.household_member_id || undefined,
    });
    setActiveTab("new");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        headName: household?.head_name || "",
        headIcNumber: household?.head_ic_number || "",
        headPhone: household?.head_phone || "",
        address: household?.address || "",
        area: household?.area || "",
        zoneId: (household as any)?.zone_id || undefined,
        notes: household?.notes || "",
      });
      setError(null);
      setSelectedSprVoterId(undefined);
      if (!isEdit) {
        setActiveTab("new");
        setSprSearchQuery("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result;
      if (isEdit && household) {
        result = await updateHousehold({
          id: household.id,
          ...formData,
        });
      } else {
        result = await createHousehold({
          ...formData,
          sprVoterId: selectedSprVoterId,
        });
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Household" : "Add New Household"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {!isEdit && (
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab("new")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "new"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="size-4" />
                  Create New
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("spr")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "spr"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="size-4" />
                  Get from SPR Data
                </div>
              </button>
            </div>
          )}

          {activeTab === "spr" && !isEdit ? (
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, IC number, or address..."
                      value={sprSearchQuery}
                      onChange={(e) => setSprSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchSpr();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={selectedVersionId || ""}
                    onChange={(e) => setSelectedVersionId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="">All Versions</option>
                    {sprVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleSearchSpr} disabled={loadingSpr || !sprSearchQuery.trim()} className="w-full">
                {loadingSpr ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Search SPR Voters
                  </>
                )}
              </Button>

              {loadingSpr ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-gray-400" />
                </div>
              ) : filteredSprVoters.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {sprSearchQuery ? "No SPR voters found matching your search" : "Search for SPR voters to select"}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  {filteredSprVoters.map((voter) => (
                    <button
                      key={voter.id}
                      type="button"
                      onClick={() => handleSelectSprVoter(voter)}
                      className="w-full flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                    >
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {voter.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {voter.nama}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {voter.no_kp || voter.alamat || "No identifier"}
                        </div>
                        {voter.alamat && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {voter.alamat}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Head of Household Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Ahmad bin Abdullah"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IC Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 850101-01-1234"
                  value={formData.headIcNumber}
                  onChange={(e) => setFormData({ ...formData, headIcNumber: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="e.g., +60 12-345 6789"
                  value={formData.headPhone}
                  onChange={(e) => setFormData({ ...formData, headPhone: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone
                </label>
                <select
                  value={formData.zoneId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zoneId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {zones.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No zones available. Create zones first.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="Additional notes about this household..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isEdit ? (
                  <Save className="size-4" />
                ) : (
                  <Home className="size-4" />
                )}
                {isEdit ? "Save Changes" : "Add Household"}
              </Button>
            </div>
          </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
