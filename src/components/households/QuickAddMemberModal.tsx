"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, UserPlus, FileText, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import {
  createMember,
  type MemberRelationship,
  type MemberStatus,
  type DependencyStatus,
  type VotingSupportStatus,
} from "@/lib/actions/households";
import { extractDateOfBirthFromIC, isEligibleToVote } from "@/lib/utils/ic-number";
import { getVotersList, getVoterVersions, type SprVoter, type SprVoterVersion } from "@/lib/actions/spr-voters";

type TabType = "new" | "spr";

type Props = {
  householdId: number;
  trigger: React.ReactNode;
};

export default function QuickAddMemberModal({ householdId, trigger }: Props) {
  const t = useTranslations("households.detail.members");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [selectedSprVoterId, setSelectedSprVoterId] = useState<number | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  // SPR voters
  const [sprVoters, setSprVoters] = useState<SprVoter[]>([]);
  const [loadingSpr, setLoadingSpr] = useState(false);
  const [sprSearchQuery, setSprSearchQuery] = useState("");
  const [sprVersions, setSprVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);

  const RELATIONSHIP_OPTIONS: { value: MemberRelationship; label: string }[] = [
    { value: "head", label: t("relationships.head") },
    { value: "spouse", label: t("relationships.spouse") },
    { value: "child", label: t("relationships.child") },
    { value: "parent", label: t("relationships.parent") },
    { value: "sibling", label: t("relationships.sibling") },
    { value: "other", label: t("relationships.other") },
  ];

  const STATUS_OPTIONS: { value: MemberStatus; label: string }[] = [
    { value: "at_home", label: t("statuses.atHome") },
    { value: "away", label: t("statuses.away") },
    { value: "deceased", label: t("statuses.deceased") },
  ];

  const DEPENDENCY_OPTIONS: { value: DependencyStatus; label: string }[] = [
    { value: "dependent", label: t("dependencies.dependent") },
    { value: "independent", label: t("dependencies.independent") },
  ];

  const VOTING_SUPPORT_OPTIONS: { value: VotingSupportStatus; label: string; color: string }[] = [
    { value: "white", label: t("votingSupport.white"), color: "bg-white border-gray-300" },
    { value: "black", label: t("votingSupport.black"), color: "bg-gray-900 text-white" },
    { value: "red", label: t("votingSupport.red"), color: "bg-red-600 text-white" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    icNumber: "",
    phone: "",
    relationship: "child" as MemberRelationship,
    dateOfBirth: "",
    locality: "",
    status: "at_home" as MemberStatus,
    dependencyStatus: "dependent" as DependencyStatus,
    votingSupportStatus: undefined as VotingSupportStatus | undefined,
    notes: "",
  });

  // Load SPR versions when modal opens
  useEffect(() => {
    if (isModalOpen) {
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
  }, [isModalOpen]);

  // Load SPR voters when tab changes or version changes
  useEffect(() => {
    if (isModalOpen && activeTab === "spr") {
      loadSprVoters();
    }
  }, [isModalOpen, activeTab, selectedVersionId]);

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

  const filteredSprVoters = sprVoters.filter(
    (voter) =>
      voter.nama.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
      voter.no_kp?.toLowerCase().includes(sprSearchQuery.toLowerCase()) ||
      voter.alamat?.toLowerCase().includes(sprSearchQuery.toLowerCase())
  );

  const handleSelectSprVoter = (voter: SprVoter) => {
    setSelectedSprVoterId(voter.id);
    const dob = voter.tarikh_lahir ? new Date(voter.tarikh_lahir).toISOString().split("T")[0] : "";
    setFormData({
      name: voter.nama || "",
      icNumber: voter.no_kp || "",
      phone: "",
      relationship: "child" as MemberRelationship,
      dateOfBirth: dob,
      locality: voter.nama_lokaliti || voter.nama_tm || "",
      status: "at_home" as MemberStatus,
      dependencyStatus: "dependent" as DependencyStatus,
      votingSupportStatus: voter.voting_support_status || undefined,
      notes: "",
    });
    setActiveTab("new");
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      icNumber: "",
      phone: "",
      relationship: "child",
      dateOfBirth: "",
      locality: "",
      status: "at_home",
      dependencyStatus: "dependent",
      votingSupportStatus: undefined,
      notes: "",
    });
    setActiveTab("new");
    setSelectedSprVoterId(undefined);
    setIsModalOpen(true);
    setError(null);
    setSprSearchQuery("");
  };

  // Auto-extract date of birth from IC number
  const handleIcNumberChange = (icNumber: string) => {
    setFormData({ ...formData, icNumber });

    // Try to extract date of birth from IC
    if (icNumber.trim()) {
      const dob = extractDateOfBirthFromIC(icNumber);
      if (dob) {
        const dobDate = new Date(dob);
        const formattedDob = dobDate.toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, icNumber, dateOfBirth: formattedDob }));
      }
    }
  };

  // Check if member is eligible to vote
  const isEligible = isEligibleToVote(formData.dateOfBirth || null);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSelectedSprVoterId(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createMember({
        householdId,
        ...formData,
        dateOfBirth: formData.dateOfBirth || undefined,
        locality: formData.locality || undefined,
        votingSupportStatus: formData.votingSupportStatus,
        sprVoterId: selectedSprVoterId,
      });

      if (result.success) {
        handleCloseModal();
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Trigger asChild onClick={handleOpenModal}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {t("modal.addTitle")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

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

          {activeTab === "spr" ? (
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
                        <div className="font-medium text-gray-900 dark:text-white">{voter.nama}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {voter.no_kp || voter.alamat || "No identifier"}
                        </div>
                        {voter.alamat && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{voter.alamat}</div>
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
                    {t("modal.name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.icNumber")}
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 850101-01-1234"
                    value={formData.icNumber}
                    onChange={(e) => handleIcNumberChange(e.target.value)}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Date of birth will be automatically extracted from IC number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.phone")}
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g., 012-345-6789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.dateOfBirth")}
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full"
                  />
                  {formData.dateOfBirth && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isEligible ? "✓ Eligible to vote (18+)" : "Not eligible to vote (under 18)"}
                    </p>
                  )}
                </div>

                {isEligible && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Voting Locality <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Sekolah Kebangsaan Taman Desa"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      required={isEligible}
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Voting place/locality for this eligible voter
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.relationship")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value as MemberRelationship })}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    required
                  >
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.status")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    required
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.dependencyStatus")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.dependencyStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dependencyStatus: e.target.value as DependencyStatus,
                      })
                    }
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    required
                  >
                    {DEPENDENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("modal.votingSupportStatus")}
                    </label>
                    <div className="flex items-center gap-2">
                      {VOTING_SUPPORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              votingSupportStatus:
                                formData.votingSupportStatus === option.value ? undefined : option.value,
                            })
                          }
                          className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
                            ${
                              formData.votingSupportStatus === option.value
                                ? option.value === "white"
                                  ? "bg-white border-gray-400 text-gray-900 shadow-md"
                                  : option.value === "black"
                                  ? "bg-gray-900 border-gray-700 text-white shadow-md"
                                  : "bg-red-600 border-red-700 text-white shadow-md"
                                : option.value === "white"
                                ? "bg-gray-50 border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400"
                                : option.value === "black"
                                ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                                : "bg-red-50 border-red-300 text-red-600 hover:bg-red-600 hover:border-red-700 hover:text-white"
                            }
                          `}
                        >
                          <span className="font-bold">
                            {option.value === "white" ? "W" : option.value === "black" ? "B" : "R"}
                          </span>
                          <span className="hidden sm:inline">{option.label.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">W</span>: Full support • <span className="font-semibold">B</span>:
                      Not supporting • <span className="font-semibold">R</span>: Not determined
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.notes")}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    {t("modal.cancel")}
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {t("addMember")}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
