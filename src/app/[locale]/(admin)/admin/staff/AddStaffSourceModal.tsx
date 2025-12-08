"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, UserPlus, Search, Users, FileText, Home, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getStaffList, type Staff } from "@/lib/actions/staff";
import { getVotersList, type SprVoter } from "@/lib/actions/spr-voters";
import { searchHouseholdMembers } from "@/lib/actions/communityUsers";
import StaffFormModal from "./StaffFormModal";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactNode;
};

type TabType = "existing" | "spr" | "household" | "new";

type HouseholdMemberResult = {
  id: number;
  name: string;
  ic_number: string | null;
  household_id: number;
  household_name: string;
  household_address: string;
  zone_name: string | null;
};

export default function AddStaffSourceModal({ trigger }: Props) {
  const router = useRouter();
  const t = useTranslations("staff.addSourceModal");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("existing");
  const [error, setError] = useState<string | null>(null);
  
  // Existing staff
  const [existingStaff, setExistingStaff] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  
  // SPR voters
  const [sprVoters, setSprVoters] = useState<SprVoter[]>([]);
  const [loadingSpr, setLoadingSpr] = useState(false);
  const [sprSearchQuery, setSprSearchQuery] = useState("");
  
  // Household members
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMemberResult[]>([]);
  const [loadingHousehold, setLoadingHousehold] = useState(false);
  const [householdSearchQuery, setHouseholdSearchQuery] = useState("");
  
  // Selected item for form
  const [selectedItem, setSelectedItem] = useState<{
    type: "existing" | "spr" | "household";
    data: Staff | SprVoter | HouseholdMemberResult;
  } | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Load data when tab changes
  useEffect(() => {
    if (open) {
      if (activeTab === "existing") {
        loadExistingStaff();
      } else if (activeTab === "spr") {
        loadSprVoters();
      } else if (activeTab === "household") {
        loadHouseholdMembers();
      }
    }
  }, [open, activeTab]);

  const loadExistingStaff = async () => {
    setLoadingStaff(true);
    setError(null);
    const result = await getStaffList({ limit: 100 });
    if (result.success && result.data) {
      setExistingStaff(result.data.data || []);
    } else {
      setError(result.error || "Failed to load staff");
      setExistingStaff([]);
    }
    setLoadingStaff(false);
  };

  const loadSprVoters = async () => {
    setLoadingSpr(true);
    setError(null);
    const result = await getVotersList({ limit: 100 });
    if (result.success && result.data) {
      setSprVoters(result.data.data || []);
    } else {
      setError(result.error || "Failed to load SPR voters");
      setSprVoters([]);
    }
    setLoadingSpr(false);
  };

  const loadHouseholdMembers = async () => {
    setLoadingHousehold(true);
    setError(null);
    const result = await searchHouseholdMembers({ limit: 100 });
    if (result.success && result.data) {
      setHouseholdMembers(result.data || []);
    } else {
      setError(result.error || "Failed to load household members");
      setHouseholdMembers([]);
    }
    setLoadingHousehold(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setActiveTab("existing");
      setStaffSearchQuery("");
      setSprSearchQuery("");
      setHouseholdSearchQuery("");
      setSelectedItem(null);
      setShowFormModal(false);
      setError(null);
    }
  };

  const handleSelectItem = (type: "existing" | "spr" | "household", data: Staff | SprVoter | HouseholdMemberResult) => {
    setSelectedItem({ type, data });
    setOpen(false); // Close source modal
    setShowFormModal(true);
  };

  const handleFormModalClose = () => {
    setShowFormModal(false);
    setSelectedItem(null);
    // Refresh the page to show new staff
    router.refresh();
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setOpen(false); // Close source modal
    setShowFormModal(true);
  };

  // Filter functions
  const filteredStaff = existingStaff.filter((staff) =>
    staff.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    (staff as any).ic_number?.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  const filteredSprVoters = sprVoters.filter((voter) =>
    voter.nama.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
    voter.no_kp?.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
    voter.alamat?.toLowerCase().includes(sprSearchQuery.toLowerCase())
  );

  const filteredHouseholdMembers = householdMembers.filter((member) =>
    member.name.toLowerCase().includes(householdSearchQuery.toLowerCase()) ||
    member.ic_number?.toLowerCase().includes(householdSearchQuery.toLowerCase()) ||
    member.household_name.toLowerCase().includes(householdSearchQuery.toLowerCase())
  );

  // Convert selected item to staff form data
  const getStaffFormData = (): Staff | undefined => {
    if (!selectedItem) return undefined;
    
    if (selectedItem.type === "existing") {
      const existingStaff = selectedItem.data as Staff;
      // Create new staff based on existing, but with id: 0 to indicate it's new
      return {
        id: 0,
        name: existingStaff.name,
        email: existingStaff.email,
        ic_number: (existingStaff as any)?.ic_number || null,
        phone: existingStaff.phone,
        role: existingStaff.role,
        position: existingStaff.position,
        zone_id: (existingStaff as any)?.zone_id || null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Staff;
    } else if (selectedItem.type === "spr") {
      const voter = selectedItem.data as SprVoter;
      return {
        id: 0,
        name: voter.nama,
        email: null,
        ic_number: voter.no_kp || null,
        phone: voter.no_hp || null,
        role: "staff",
        position: null,
        zone_id: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Staff;
    } else if (selectedItem.type === "household") {
      const member = selectedItem.data as HouseholdMemberResult;
      return {
        id: 0,
        name: member.name,
        email: null,
        ic_number: member.ic_number,
        phone: null,
        role: "staff",
        position: null,
        zone_id: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Staff;
    }
    return undefined;
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {t("title")}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab("existing")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "existing"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="size-4" />
                  {t("existingTab")}
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
                  {t("sprTab")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("household")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "household"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="size-4" />
                  {t("householdTab")}
                </div>
              </button>
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
                  {t("newTab")}
                </div>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {activeTab === "existing" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("existingDescription")}
                  </p>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {loadingStaff ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Users className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {staffSearchQuery ? t("noResultsFound") : t("noStaffFound")}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                      {filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => handleSelectItem("existing", staff)}
                          className="w-full flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                        >
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {staff.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {staff.email || (staff as any).ic_number || t("noIdentifier")}
                            </div>
                            {staff.position && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {staff.position}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "spr" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("sprDescription")}
                  </p>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={sprSearchQuery}
                      onChange={(e) => setSprSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {loadingSpr ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredSprVoters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <FileText className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {sprSearchQuery ? t("noResultsFound") : t("noSprVotersFound")}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                      {filteredSprVoters.map((voter) => (
                        <button
                          key={voter.id}
                          type="button"
                          onClick={() => handleSelectItem("spr", voter)}
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
                              {voter.no_kp || t("noIdentifier")}
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
              )}

              {activeTab === "household" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("householdDescription")}
                  </p>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={householdSearchQuery}
                      onChange={(e) => setHouseholdSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {loadingHousehold ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredHouseholdMembers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Home className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {householdSearchQuery ? t("noResultsFound") : t("noHouseholdMembersFound")}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                      {filteredHouseholdMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectItem("household", member)}
                          className="w-full flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                        >
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {member.ic_number || t("noIdentifier")}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {member.household_name} - {member.household_address}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "new" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("newDescription")}
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={handleCreateNew} className="gap-2">
                      <UserPlus className="size-4" />
                      {t("createNewStaff")}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab !== "new" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline">
                      {tCommon("cancel")}
                    </Button>
                  </Dialog.Close>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Staff Form Modal */}
      {showFormModal && (
        <StaffFormModal
          open={showFormModal}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleFormModalClose();
            }
          }}
          staff={selectedItem ? getStaffFormData() : undefined}
        />
      )}
    </>
  );
}
