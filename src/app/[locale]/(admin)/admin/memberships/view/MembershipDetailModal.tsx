"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Membership, updateMembershipStatus } from "@/lib/actions/memberships";
import { Loader2 } from "lucide-react";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type MembershipDetailModalProps = {
  membership: Membership;
  onClose: () => void;
};

export default function MembershipDetailModal({
  membership,
  onClose,
}: MembershipDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState(membership.status);

  const handleStatusUpdate = () => {
    if (newStatus === membership.status) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateMembershipStatus(
        membership.id,
        newStatus as "active" | "inactive" | "suspended" | "terminated"
      );

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to update membership status");
      }
    });
  };

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
              Membership Details
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Membership Number */}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Number</label>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{membership.membership_number}</p>
            </div>

            {/* Status Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
                {newStatus !== membership.status && (
                  <Button onClick={handleStatusUpdate} disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Zone and Cawangan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Zone</label>
                <p className="text-gray-900 dark:text-white">{membership.zone?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cawangan</label>
                <p className="text-gray-900 dark:text-white">{membership.cawangan?.name}</p>
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="text-gray-900 dark:text-white">{membership.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IC Number</label>
                  <p className="text-gray-900 dark:text-white">{membership.ic_number}</p>
                </div>
                {membership.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-white">{membership.phone}</p>
                  </div>
                )}
                {membership.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{membership.email}</p>
                  </div>
                )}
                {membership.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(membership.date_of_birth)}
                    </p>
                  </div>
                )}
                {membership.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                    <p className="text-gray-900 dark:text-white">{membership.gender === "L" ? "Male" : "Female"}</p>
                  </div>
                )}
                {membership.race && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Race</label>
                    <p className="text-gray-900 dark:text-white">{membership.race}</p>
                  </div>
                )}
                {membership.religion && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Religion</label>
                    <p className="text-gray-900 dark:text-white">{membership.religion}</p>
                  </div>
                )}
                {membership.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                    <p className="text-gray-900 dark:text-white">{membership.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Photo</h3>
              {membership.photo_url ? (
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md p-2">
                      <img
                        src={membership.photo_url}
                        alt="Member photo"
                        className="max-w-full max-h-96 w-auto h-auto object-contain rounded-lg"
                        style={{ minHeight: "200px", minWidth: "200px" }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error("Image failed to load:", membership.photo_url);
                          const parent = target.closest(".relative");
                          if (parent) {
                            parent.innerHTML = `
                              <div class="p-8 text-center text-gray-500 dark:text-gray-400 min-h-[200px] flex flex-col items-center justify-center">
                                <p class="font-medium mb-2">Photo failed to load</p>
                                <p class="text-xs mt-2 break-all text-gray-400 dark:text-gray-500">${membership.photo_url}</p>
                                <a href="${membership.photo_url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline mt-2 text-sm">Open in new tab</a>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", membership.photo_url);
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                    <span className="font-medium">URL:</span> {membership.photo_url}
                  </div>
                  <a
                    href={membership.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline inline-block"
                  >
                    Open photo in new tab →
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p>No photo uploaded</p>
                </div>
              )}
            </div>

            {/* Membership Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Membership Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Joined Date:</span>{" "}
                  {formatDate(membership.joined_date)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{membership.status}</span>
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
