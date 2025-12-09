"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, XCircle, Calendar, MapPin, Phone, Mail, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  reviewMembershipApplicationByZone,
  approveMembershipApplication,
  rejectMembershipApplication,
  MembershipApplication,
} from "@/lib/actions/memberships";
import { Loader2 } from "lucide-react";

type MembershipApplicationDetailModalProps = {
  application: MembershipApplication;
  onClose: () => void;
  canReviewZone?: boolean;
  canApprove?: boolean;
};

export default function MembershipApplicationDetailModal({
  application,
  onClose,
  canReviewZone = false,
  canApprove = false,
}: MembershipApplicationDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showZoneReview, setShowZoneReview] = useState(false);
  const [showAdminApproval, setShowAdminApproval] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [zoneSupports, setZoneSupports] = useState(true);
  const [zoneRemarks, setZoneRemarks] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");

  const handleZoneReview = () => {
    setError(null);
    startTransition(async () => {
      const result = await reviewMembershipApplicationByZone({
        applicationId: application.id,
        supports: zoneSupports,
        remarks: zoneRemarks || undefined,
      });

      if (result.success) {
        setShowZoneReview(false);
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to review application");
      }
    });
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveMembershipApplication({
        applicationId: application.id,
        remarks: adminRemarks || undefined,
      });

      if (result.success) {
        setShowAdminApproval(false);
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to approve application");
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectMembershipApplication(application.id, rejectRemarks || undefined);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to reject application");
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
              Membership Application Details
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
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    application.status === "approved"
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : application.status === "rejected"
                      ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      : application.status === "zone_reviewed"
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                      : application.status === "submitted"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {canReviewZone && application.status === "submitted" && (
                  <Button variant="outline" onClick={() => setShowZoneReview(true)}>
                    Zone Review
                  </Button>
                )}
                {canApprove && application.status === "zone_reviewed" && application.zone_supports && (
                  <>
                    <Button variant="outline" onClick={() => setShowAdminApproval(true)}>
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => setShowReject(true)}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Zone Review Form */}
            {showZoneReview && (
              <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-semibold mb-4">Zone Office Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={zoneSupports}
                        onChange={(e) => setZoneSupports(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Support this application</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Remarks</label>
                    <textarea
                      value={zoneRemarks}
                      onChange={(e) => setZoneRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter remarks (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowZoneReview(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleZoneReview} disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Approval Form */}
            {showAdminApproval && (
              <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-semibold mb-4">Admin Approval</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      A membership number will be automatically generated upon approval.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Remarks</label>
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter remarks (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAdminApproval(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApprove} disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Approve Application"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reject Form */}
            {showReject && (
              <div className="p-4 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h3 className="text-lg font-semibold mb-4 text-red-900 dark:text-red-200">Reject Application</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Remarks</label>
                    <textarea
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter reason for rejection (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowReject(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleReject} disabled={isPending} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Reject Application"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Zone and Cawangan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Zone</label>
                <p className="text-gray-900 dark:text-white">{application.zone?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cawangan</label>
                <p className="text-gray-900 dark:text-white">{application.cawangan?.name}</p>
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="text-gray-900 dark:text-white">{application.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IC Number</label>
                  <p className="text-gray-900 dark:text-white">{application.ic_number}</p>
                </div>
                {application.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-white">{application.phone}</p>
                  </div>
                )}
                {application.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{application.email}</p>
                  </div>
                )}
                {application.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(application.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {application.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                    <p className="text-gray-900 dark:text-white">{application.gender === "L" ? "Male" : "Female"}</p>
                  </div>
                )}
                {application.race && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Race</label>
                    <p className="text-gray-900 dark:text-white">{application.race}</p>
                  </div>
                )}
                {application.religion && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Religion</label>
                    <p className="text-gray-900 dark:text-white">{application.religion}</p>
                  </div>
                )}
                {application.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                    <p className="text-gray-900 dark:text-white">{application.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Photo</h3>
              {application.photo_url ? (
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md p-2">
                      <img
                        src={application.photo_url}
                        alt="Applicant photo"
                        className="max-w-full max-h-96 w-auto h-auto object-contain rounded-lg"
                        style={{ minHeight: "200px", minWidth: "200px" }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error("Image failed to load:", application.photo_url);
                          const parent = target.closest(".relative");
                          if (parent) {
                            parent.innerHTML = `
                              <div class="p-8 text-center text-gray-500 dark:text-gray-400 min-h-[200px] flex flex-col items-center justify-center">
                                <p class="font-medium mb-2">Photo failed to load</p>
                                <p class="text-xs mt-2 break-all text-gray-400 dark:text-gray-500">${application.photo_url}</p>
                                <a href="${application.photo_url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline mt-2 text-sm">Open in new tab</a>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", application.photo_url);
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                    <span className="font-medium">URL:</span> {application.photo_url}
                  </div>
                  <a
                    href={application.photo_url}
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

            {/* Previous Membership */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Previous Membership</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Was previously a member of this party:</span>{" "}
                  {application.was_previous_member ? "Yes" : "No"}
                </p>
                {application.previous_parties && application.previous_parties.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Previous Party Memberships:</p>
                    <div className="space-y-2">
                      {application.previous_parties.map((party, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                          <p className="font-medium">{party.party_name}</p>
                          {party.from_date && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              From: {new Date(party.from_date).toLocaleDateString()}
                            </p>
                          )}
                          {party.to_date && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              To: {new Date(party.to_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zone Review Info */}
            {application.zone_reviewed_at && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Zone Review</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {application.zone_supports ? (
                      <span className="text-green-600 dark:text-green-400">Supported</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Not Supported</span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Reviewed at:</span>{" "}
                    {new Date(application.zone_reviewed_at).toLocaleString()}
                  </p>
                  {application.zone_remarks && (
                    <p>
                      <span className="font-medium">Remarks:</span> {application.zone_remarks}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Admin Approval Info */}
            {application.approved_at && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Admin Approval</h3>
                <div className="space-y-2">
                  {application.membership_number && (
                    <p>
                      <span className="font-medium">Membership Number:</span> {application.membership_number}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Approved at:</span>{" "}
                    {new Date(application.approved_at).toLocaleString()}
                  </p>
                  {application.admin_remarks && (
                    <p>
                      <span className="font-medium">Remarks:</span> {application.admin_remarks}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
