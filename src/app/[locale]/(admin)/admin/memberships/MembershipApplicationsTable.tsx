"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Eye, CheckCircle2, XCircle, Clock, User, X } from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import { MembershipApplication } from "@/lib/actions/memberships";
import MembershipApplicationDetailModal from "./MembershipApplicationDetailModal";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type MembershipApplicationsTableProps = {
  applications: MembershipApplication[];
};

export default function MembershipApplicationsTable({ applications }: MembershipApplicationsTableProps) {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "draft":
        return (
          <span className={`${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200`}>
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className={`${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`}>
            Submitted
          </span>
        );
      case "zone_reviewed":
        return (
          <span className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200`}>
            Zone Reviewed
          </span>
        );
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200`}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`}>
            Rejected
          </span>
        );
      default:
        return <span className={baseClasses}>{status}</span>;
    }
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Applications</h3>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="zone_reviewed">Zone Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <DataTable emptyMessage="No membership applications found">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  IC Number
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Zone / Cawangan
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Submitted
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <DataTableEmpty colSpan={6} message="No membership applications found." />
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.photo_url ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ url: app.photo_url!, name: app.full_name });
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 p-0 border-0 bg-transparent"
                            type="button"
                          >
                            <img
                              src={app.photo_url}
                              alt={app.full_name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {app.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {app.ic_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {app.zone?.name} / {app.cawangan?.name}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedApplication(app)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </div>

      {selectedApplication && (
        <MembershipApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          canReviewZone={true}
          canApprove={true}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog.Root open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
            <Dialog.Content
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setPreviewImage(null);
                }
              }}
              tabIndex={-1}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>
                  Photo preview for {previewImage.name}
                </Dialog.Title>
              </VisuallyHidden.Root>
              <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
                {/* Close button */}
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="size-6" />
                  </button>
                </Dialog.Close>

                {/* Image */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={previewImage.url}
                    alt={`Photo preview for ${previewImage.name}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
