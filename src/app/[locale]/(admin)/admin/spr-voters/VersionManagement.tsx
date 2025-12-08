"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Check, X, XCircle } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createVoterVersion,
  updateVoterVersion,
  deleteVoterVersion,
  clearVersionVoters,
  type SprVoterVersion,
} from "@/lib/actions/spr-voters";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type VersionManagementProps = {
  versions: SprVoterVersion[];
  selectedVersionId?: number;
};

export default function VersionManagement({
  versions,
  selectedVersionId,
}: VersionManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<SprVoterVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SprVoterVersion | null>(null);
  const [clearTarget, setClearTarget] = useState<SprVoterVersion | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    electionDate: "",
    isActive: false,
  });

  const handleCreateVersion = () => {
    setEditingVersion(null);
    setFormData({
      name: "",
      description: "",
      electionDate: "",
      isActive: false,
    });
    setIsFormOpen(true);
  };

  const handleEditVersion = (version: SprVoterVersion) => {
    setEditingVersion(version);
    setFormData({
      name: version.name,
      description: version.description || "",
      electionDate: version.election_date
        ? new Date(version.election_date).toISOString().slice(0, 10)
        : "",
      isActive: version.is_active,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Version name is required");
      return;
    }

    startTransition(async () => {
      let result;
      if (editingVersion) {
        result = await updateVoterVersion({
          id: editingVersion.id,
          name: formData.name,
          description: formData.description || undefined,
          electionDate: formData.electionDate || undefined,
          isActive: formData.isActive,
        });
      } else {
        result = await createVoterVersion({
          name: formData.name,
          description: formData.description || undefined,
          electionDate: formData.electionDate || undefined,
          isActive: formData.isActive,
        });
      }

      if (!result.success) {
        alert(result.error || "Failed to save version");
        return;
      }

      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteVoterVersion(deleteTarget.id);
      if (!result.success) {
        alert(result.error || "Failed to delete version");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleClearVoters = async () => {
    if (!clearTarget) return;

    startTransition(async () => {
      const result = await clearVersionVoters(clearTarget.id);
      if (!result.success) {
        alert(result.error || "Failed to clear imported data");
        return;
      }
      setClearTarget(null);
      router.refresh();
    });
  };

  const handleSelectVersion = (versionId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("versionId", versionId.toString());
    params.delete("page"); // Reset to first page
    router.push(`/admin/spr-voters?${params.toString()}`);
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Voter Versions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage different election rounds and voter lists
            </p>
          </div>
          <Button onClick={handleCreateVersion} className="gap-2">
            <Plus className="size-4" />
            New Version
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedVersionId === version.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
              }`}
              onClick={() => handleSelectVersion(version.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">{version.name}</h4>
                {version.is_active && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full">
                    Active
                  </span>
                )}
              </div>
              {version.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {version.description}
                </p>
              )}
              {version.election_date && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Election: {formatDate(version.election_date)}
                </p>
              )}
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 text-gray-500 hover:text-primary rounded"
                  onClick={() => handleEditVersion(version)}
                  title="Edit"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  className="p-1.5 text-gray-500 hover:text-orange-600 rounded"
                  onClick={() => setClearTarget(version)}
                  title="Clear Imported Data"
                >
                  <XCircle className="size-4" />
                </button>
                <button
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                  onClick={() => setDeleteTarget(version)}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          {versions.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No versions created yet. Create your first version to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Version Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingVersion ? "Edit Version" : "Create New Version"}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Version Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., GE15, PRN2023"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Description
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  placeholder="Description of this version..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Election Date
                </label>
                <Input
                  type="date"
                  value={formData.electionDate}
                  onChange={(e) => setFormData({ ...formData, electionDate: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={isPending}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="is-active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Set as active version
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isPending}>
                  {editingVersion ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Delete Version
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? This will also delete all
              voters in this version. This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={isPending}>
                  Delete
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Clear Imported Data Confirmation Dialog */}
      <AlertDialog.Root open={!!clearTarget} onOpenChange={(open) => !open && setClearTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Clear Imported Data
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to clear all imported voters for{" "}
              <span className="font-semibold">{clearTarget?.name}</span>? This will delete all voters
              in this version, but the version itself will remain. You can then re-upload data. This
              action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleClearVoters}
                  disabled={isPending}
                >
                  Clear Data
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
