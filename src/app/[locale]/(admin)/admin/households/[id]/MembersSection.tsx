"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Trash2, Edit2, Home, UserX, Baby } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createMember,
  updateMember,
  deleteMember,
  type HouseholdMember,
  type MemberRelationship,
  type MemberStatus,
  type DependencyStatus,
  type VotingSupportStatus,
} from "@/lib/actions/households";
import { extractDateOfBirthFromIC, isEligibleToVote } from "@/lib/utils/ic-number";

type Props = {
  householdId: number;
  members: HouseholdMember[];
  isAdmin: boolean;
};

export default function MembersSection({ householdId, members, isAdmin }: Props) {
  const t = useTranslations("households.detail.members");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    icNumber: "",
    relationship: "child" as MemberRelationship,
    dateOfBirth: "",
    locality: "",
    status: "at_home" as MemberStatus,
    dependencyStatus: "dependent" as DependencyStatus,
    votingSupportStatus: undefined as VotingSupportStatus | undefined,
    notes: "",
  });

  const handleOpenModal = (member?: HouseholdMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        icNumber: member.ic_number || "",
        relationship: member.relationship,
        dateOfBirth: member.date_of_birth ? member.date_of_birth.split("T")[0] : "",
        locality: (member as any).locality || "",
        status: member.status,
        dependencyStatus: member.dependency_status,
        votingSupportStatus: member.voting_support_status || undefined,
        notes: member.notes || "",
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: "",
        icNumber: "",
        relationship: "child",
        dateOfBirth: "",
        locality: "",
        status: "at_home",
        dependencyStatus: "dependent",
        votingSupportStatus: undefined,
        notes: "",
      });
    }
    setIsModalOpen(true);
    setError(null);
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
    setEditingMember(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result;
      if (editingMember) {
        result = await updateMember({
          id: editingMember.id,
          ...formData,
          dateOfBirth: formData.dateOfBirth || undefined,
          locality: formData.locality || undefined,
          votingSupportStatus: formData.votingSupportStatus || null,
        });
      } else {
        result = await createMember({
          householdId,
          ...formData,
          dateOfBirth: formData.dateOfBirth || undefined,
          locality: formData.locality || undefined,
          votingSupportStatus: formData.votingSupportStatus,
        });
      }

      if (result.success) {
        handleCloseModal();
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  const handleDelete = (memberId: number) => {
    if (!confirm(t("modal.deleteConfirm"))) return;

    startTransition(async () => {
      const result = await deleteMember(memberId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || t("modal.deleteConfirm"));
      }
    });
  };

  const handleQuickUpdateVotingStatus = (memberId: number, status: VotingSupportStatus | null) => {
    startTransition(async () => {
      const result = await updateMember({
        id: memberId,
        votingSupportStatus: status,
      });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to update voting support status");
      }
    });
  };

  const atHomeCount = members.filter((m) => m.status === "at_home").length;
  const dependentsCount = members.filter((m) => m.dependency_status === "dependent").length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="size-5" />
            {t("title", { count: members.length })}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("summary", { atHome: atHomeCount, dependents: dependentsCount })}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="size-4" />
          {t("addMember")}
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="size-12 mx-auto mb-3 text-gray-400" />
          <p>{t("noMembers")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.name")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.relationship")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.status")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.dependency")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.dateOfBirth")}</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.votingSupport")}</th>
                )}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.name}</div>
                    {member.ic_number && (
                      <div className="text-xs text-gray-500">{member.ic_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {RELATIONSHIP_OPTIONS.find((r) => r.value === member.relationship)?.label}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {member.status === "at_home" ? (
                        <Home className="size-4 text-green-600" />
                      ) : member.status === "away" ? (
                        <UserX className="size-4 text-yellow-600" />
                      ) : (
                        <UserX className="size-4 text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          member.status === "at_home"
                            ? "text-green-700"
                            : member.status === "away"
                            ? "text-yellow-700"
                            : "text-gray-500"
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === member.status)?.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {member.dependency_status === "dependent" && (
                        <Baby className="size-4 text-orange-600" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          member.dependency_status === "dependent"
                            ? "text-orange-700"
                            : "text-gray-700"
                        }`}
                      >
                        {DEPENDENCY_OPTIONS.find((d) => d.value === member.dependency_status)?.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {member.date_of_birth
                      ? (() => {
                          const date = new Date(member.date_of_birth);
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = date.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()
                      : "—"}
                    {member.date_of_birth && isEligibleToVote(member.date_of_birth) && (
                      <div className="text-xs text-green-600 mt-1">{t("table.eligibleToVote")}</div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {VOTING_SUPPORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleQuickUpdateVotingStatus(
                              member.id,
                              member.voting_support_status === option.value ? null : option.value
                            )}
                            disabled={isPending}
                            className={`
                              inline-flex items-center justify-center rounded-full w-8 h-8 text-xs font-medium border-2 transition-all
                              ${
                                member.voting_support_status === option.value
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
                              ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                            title={
                              member.voting_support_status === option.value
                                ? `Click to remove ${option.label}`
                                : `Click to set ${option.label}`
                            }
                          >
                            {option.value === "white" ? "W" : option.value === "black" ? "B" : "R"}
                          </button>
                        ))}
                      </div>
                      {member.voting_support_status && (
                        <div className="text-xs text-gray-500 mt-1">
                          {VOTING_SUPPORT_OPTIONS.find((v) => v.value === member.voting_support_status)?.label}
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-1.5 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                        title="Delete"
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Form Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {editingMember ? t("modal.editTitle") : t("modal.addTitle")}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

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
                    onChange={(e) =>
                      setFormData({ ...formData, relationship: e.target.value as MemberRelationship })
                    }
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
                      <span className="font-semibold">W</span>: Full support • <span className="font-semibold">B</span>: Not supporting • <span className="font-semibold">R</span>: Not determined
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
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {editingMember ? t("modal.save") : t("addMember")}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
