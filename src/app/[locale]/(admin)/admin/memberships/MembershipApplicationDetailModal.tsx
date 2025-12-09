"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X, CheckCircle2, XCircle, Calendar, MapPin, Phone, Mail, User, FileText, History, Image as ImageIcon, Info, ClipboardCheck, ShieldCheck, Award, Printer, Link2, Search, Trash2, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  reviewMembershipApplicationByZone,
  approveMembershipApplication,
  rejectMembershipApplication,
  previewNextMembershipNumber,
  autoLinkSprVoters,
  getLinkedSprVoters,
  linkSprVoter,
  unlinkSprVoter,
  searchSprVotersForLinking,
  LinkedSprVoter,
  MembershipApplication,
} from "@/lib/actions/memberships";
import { getVoterVersions } from "@/lib/actions/spr-voters";
import type { SprVoterVersion } from "@/lib/actions/spr-voters";
import { Loader2 } from "lucide-react";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

// Format date and time consistently
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

type MembershipApplicationDetailModalProps = {
  application: MembershipApplication;
  onClose: () => void;
  canReviewZone?: boolean;
  canApprove?: boolean;
};

type TabType = "overview" | "personal" | "photo" | "history" | "zone_review" | "approval" | "certificate" | "spr" | "review";

export default function MembershipApplicationDetailModal({
  application,
  onClose,
  canReviewZone = false,
  canApprove = false,
}: MembershipApplicationDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showZoneReview, setShowZoneReview] = useState(false);
  const [showAdminApproval, setShowAdminApproval] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [zoneSupports, setZoneSupports] = useState(true);
  const [zoneRemarks, setZoneRemarks] = useState("");
  const [previewMembershipNumber, setPreviewMembershipNumber] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [linkedSprVoters, setLinkedSprVoters] = useState<LinkedSprVoter[]>([]);
  const [loadingSprVoters, setLoadingSprVoters] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [showSprSearch, setShowSprSearch] = useState(false);
  const [sprSearchQuery, setSprSearchQuery] = useState("");
  const [sprSearchResults, setSprSearchResults] = useState<any[]>([]);
  const [searchingSpr, setSearchingSpr] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sprVersions, setSprVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const [linkConfirmTarget, setLinkConfirmTarget] = useState<{ id: number; nama: string; version?: string } | null>(null);
  const [unlinkConfirmTarget, setUnlinkConfirmTarget] = useState<{ id: number; nama: string; version?: string } | null>(null);

  // Load preview membership number when approval tab is opened
  useEffect(() => {
    if (
      activeTab === "approval" &&
      canApprove &&
      application.status === "zone_reviewed" &&
      application.zone_supports &&
      !application.approved_at &&
      !previewMembershipNumber
    ) {
      setLoadingPreview(true);
      previewNextMembershipNumber()
        .then((result) => {
          if (result.success && result.data) {
            setPreviewMembershipNumber(result.data);
          }
          setLoadingPreview(false);
        })
        .catch(() => {
          setLoadingPreview(false);
        });
    }
  }, [activeTab, canApprove, application.status, application.zone_supports, application.approved_at, previewMembershipNumber]);

  // Load SPR versions and linked SPR voters when SPR tab is opened
  useEffect(() => {
    if (activeTab === "spr") {
      // Load SPR versions
      getVoterVersions().then((result) => {
        if (result.success && result.data) {
          setSprVersions(result.data);
        }
      });

      // Load linked SPR voters
      setLoadingSprVoters(true);
      getLinkedSprVoters(application.id)
        .then((result) => {
          if (result.success && result.data) {
            setLinkedSprVoters(result.data);
          }
          setLoadingSprVoters(false);
        })
        .catch(() => {
          setLoadingSprVoters(false);
        });
    }
  }, [activeTab, application.id]);

  const handleAutoLinkSpr = () => {
    setError(null);
    setAutoLinking(true);
    startTransition(async () => {
      const result = await autoLinkSprVoters(application.id);
      if (result.success && result.data) {
        // Reload linked SPR voters
        const linkedResult = await getLinkedSprVoters(application.id);
        if (linkedResult.success && linkedResult.data) {
          setLinkedSprVoters(linkedResult.data);
        }
        if (result.data.linked > 0) {
          router.refresh();
        } else {
          // No matches found
          setError(`No SPR voter records found matching IC number: ${application.ic_number}. Please try manual search or verify the IC number is correct.`);
        }
      } else {
        setError(result.error || "Failed to auto-link SPR voters");
      }
      setAutoLinking(false);
    });
  };

  const handleSearchSpr = () => {
    if (!sprSearchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }
    setError(null);
    setSearchingSpr(true);
    setHasSearched(false);
    searchSprVotersForLinking({
      search: sprSearchQuery,
      versionId: selectedVersionId,
      limit: 50, // Increased limit to show more results
    })
      .then((result) => {
        if (result.success && result.data) {
          setSprSearchResults(result.data);
          setHasSearched(true);
          if (result.data.length === 0) {
            setError(`No SPR voter records found matching "${sprSearchQuery}". Try searching with a different term or IC number.`);
          }
        } else {
          setError(result.error || "Failed to search SPR voters");
          setHasSearched(true);
        }
        setSearchingSpr(false);
      })
      .catch((err) => {
        setError("Failed to search SPR voters. Please try again.");
        setHasSearched(true);
        setSearchingSpr(false);
      });
  };

  const handleLinkSprVoterClick = (voter: any) => {
    setLinkConfirmTarget({
      id: voter.id,
      nama: voter.nama,
      version: voter.version?.name,
    });
  };

  const handleConfirmLinkSprVoter = () => {
    if (!linkConfirmTarget) return;
    
    setError(null);
    startTransition(async () => {
      const result = await linkSprVoter(application.id, linkConfirmTarget.id);
      if (result.success) {
        // Reload linked SPR voters
        const linkedResult = await getLinkedSprVoters(application.id);
        if (linkedResult.success && linkedResult.data) {
          setLinkedSprVoters(linkedResult.data);
        }
        // Remove from search results
        setSprSearchResults((prev) => prev.filter((v) => v.id !== linkConfirmTarget.id));
        setLinkConfirmTarget(null);
        router.refresh();
      } else {
        setError(result.error || "Failed to link SPR voter");
      }
    });
  };

  const handleUnlinkSprVoterClick = (link: LinkedSprVoter) => {
    setUnlinkConfirmTarget({
      id: link.spr_voter_id,
      nama: link.spr_voter.nama,
      version: link.spr_voter.version?.name,
    });
  };

  const handleConfirmUnlinkSprVoter = () => {
    if (!unlinkConfirmTarget) return;
    
    setError(null);
    startTransition(async () => {
      const result = await unlinkSprVoter(application.id, unlinkConfirmTarget.id);
      if (result.success) {
        // Reload linked SPR voters
        const linkedResult = await getLinkedSprVoters(application.id);
        if (linkedResult.success && linkedResult.data) {
          setLinkedSprVoters(linkedResult.data);
        }
        setUnlinkConfirmTarget(null);
        router.refresh();
      } else {
        setError(result.error || "Failed to unlink SPR voter");
      }
    });
  };

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

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Info },
    { id: "personal" as TabType, label: "Personal Info", icon: User },
    { id: "photo" as TabType, label: "Photo", icon: ImageIcon },
    { id: "history" as TabType, label: "Previous Membership", icon: History },
    { id: "zone_review" as TabType, label: "Zone Review", icon: ClipboardCheck },
    { id: "approval" as TabType, label: "Approval", icon: ShieldCheck },
    { id: "certificate" as TabType, label: "Certificate", icon: Award },
    { id: "spr" as TabType, label: "SPR", icon: Link2 },
    { id: "review" as TabType, label: "Review History", icon: FileText },
  ];

  return (
    <>
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm print:hidden" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col z-50 overflow-hidden print:fixed print:top-0 print:left-0 print:translate-x-0 print:translate-y-0 print:max-h-none print:max-w-full print:shadow-none print:rounded-none print:bg-white">
          {/* Header - Resume Style */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 text-white px-8 py-6 print:hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Dialog.Title className="text-3xl font-bold mb-2 tracking-tight">
                  {application.full_name}
                </Dialog.Title>
                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {application.email || "No email"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {application.phone || "No phone"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {application.zone?.name} / {application.cawangan?.name}
                  </span>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Application Status</span>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  application.status === "approved"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : application.status === "rejected"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : application.status === "zone_reviewed"
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    : application.status === "submitted"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-slate-700 text-slate-300 border border-slate-600"
                }`}
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace("_", " ")}
              </span>
              {application.membership_number && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400">Membership #: <span className="text-slate-200 font-medium">{application.membership_number}</span></span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons Bar */}
          {canApprove && application.status === "zone_reviewed" && application.zone_supports && !application.approved_at && (
            <div className="px-8 py-3 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setActiveTab("review"); setShowAdminApproval(true); }} className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button variant="outline" onClick={() => setShowReject(true)} className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Tabs - Resume Style */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-8 bg-white dark:bg-slate-900 print:hidden">
            <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all
                      ${
                        isActive
                          ? "border-slate-800 dark:border-slate-200 text-slate-900 dark:text-slate-100"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content - Resume Style */}
          <div className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 ${activeTab === "certificate" ? "print:bg-white" : ""}`}>
            <div className={`max-w-5xl mx-auto p-8 ${activeTab === "certificate" ? "print:max-w-full print:p-0" : ""}`}>
            {/* Action Forms - Show when active */}
            {showZoneReview && activeTab === "zone_review" && (
              <div className="mb-8 p-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-r-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Zone Office Review Form
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneSupports}
                        onChange={(e) => setZoneSupports(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter remarks (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => { setShowZoneReview(false); setZoneRemarks(""); }}>
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

            {showAdminApproval && activeTab === "approval" && (
              <div className="mb-8 p-6 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 rounded-r-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Admin Approval Form
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Membership Number (Auto-Generated)
                    </label>
                    {loadingPreview ? (
                      <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span className="text-slate-500 dark:text-slate-400">Generating membership number...</span>
                      </div>
                    ) : previewMembershipNumber ? (
                      <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                          {previewMembershipNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          System generated - Format: M{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, "0")}XXXXXX
                        </p>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600">
                        <p className="text-slate-500 dark:text-slate-400">Unable to preview membership number</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Remarks</label>
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="Enter remarks (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => { setShowAdminApproval(false); setAdminRemarks(""); setPreviewMembershipNumber(null); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleApprove} disabled={isPending || !previewMembershipNumber}>
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

            {showReject && (
              <div className="mb-8 p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-900 dark:text-red-200">
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Remarks</label>
                    <textarea
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      placeholder="Enter reason for rejection (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => { setShowReject(false); setRejectRemarks(""); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleReject} disabled={isPending} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
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

            {/* Tab Content - Resume Style */}
            {activeTab === "overview" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <div className="space-y-8">
                  {/* Quick Info Section */}
                  <section>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                      Quick Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Zone</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{application.zone?.name || "—"}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cawangan</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{application.cawangan?.name || "—"}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Application Date</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatDate(application.created_at)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">IC Number</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{application.ic_number}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "personal" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Personal Information
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</span>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{application.full_name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">IC Number</span>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{application.ic_number}</p>
                      </div>
                      {application.date_of_birth && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date of Birth</span>
                          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">{formatDate(application.date_of_birth)}</p>
                        </div>
                      )}
                      {application.gender && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gender</span>
                          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">{application.gender === "L" ? "Male" : "Female"}</p>
                        </div>
                      )}
                      {application.race && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Race</span>
                          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">{application.race}</p>
                        </div>
                      )}
                      {application.religion && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Religion</span>
                          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">{application.religion}</p>
                        </div>
                      )}
                    </div>
                    {application.phone && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          Phone
                        </span>
                        <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">{application.phone}</p>
                      </div>
                    )}
                    {application.email && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          Email
                        </span>
                        <p className="mt-1 text-lg text-slate-900 dark:text-slate-100 break-all">{application.email}</p>
                      </div>
                    )}
                    {application.address && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Address</span>
                        <p className="mt-2 text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{application.address}</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "photo" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Photo
                  </h2>
                  {application.photo_url ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 shadow-md p-6">
                          <img
                            src={application.photo_url}
                            alt="Applicant photo"
                            className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded"
                            style={{ minHeight: "250px", minWidth: "250px" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error("Image failed to load:", application.photo_url);
                              const parent = target.closest(".relative");
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="p-12 text-center text-slate-500 dark:text-slate-400 min-h-[250px] flex flex-col items-center justify-center">
                                    <ImageIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p class="font-medium mb-2">Photo failed to load</p>
                                    <a href="${application.photo_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline mt-2 text-sm">Open in new tab</a>
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
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Photo URL</span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 break-all font-mono">{application.photo_url}</p>
                        <a
                          href={application.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Open photo in new tab →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">No photo uploaded</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Previous Membership
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                        Was previously a member of this party
                      </span>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {application.was_previous_member ? (
                          <span className="text-green-600 dark:text-green-400">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </p>
                    </div>
                    {application.previous_parties && application.previous_parties.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                          Previous Party Memberships
                        </h3>
                        <div className="space-y-4">
                          {application.previous_parties.map((party, index) => (
                            <div
                              key={index}
                              className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-slate-400 dark:border-slate-600"
                            >
                              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{party.party_name}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {party.from_date && (
                                  <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">From</span>
                                    <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDate(party.from_date)}</p>
                                  </div>
                                )}
                                {party.to_date && (
                                  <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">To</span>
                                    <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDate(party.to_date)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-slate-500 dark:text-slate-400">No previous party memberships</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "zone_review" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Zone Review
                  </h2>
                  
                  {(showZoneReview || (canReviewZone && application.status === "submitted" && !application.zone_reviewed_at)) ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-l-4 border-blue-500">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <ClipboardCheck className="w-5 h-5" />
                          Zone Office Review Form
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center space-x-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={zoneSupports}
                                onChange={(e) => setZoneSupports(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Support this application</span>
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Remarks</label>
                            <textarea
                              value={zoneRemarks}
                              onChange={(e) => setZoneRemarks(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter remarks (optional)"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="outline" onClick={() => { setShowZoneReview(false); setZoneRemarks(""); }}>
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
                    </div>
                  ) : application.zone_reviewed_at ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-l-4 border-blue-500">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Zone Review Completed
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                            <p className="mt-1">
                              {application.zone_supports ? (
                                <span className="text-green-600 dark:text-green-400 font-semibold text-lg">✓ Supported</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-semibold text-lg">✗ Not Supported</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reviewed at</span>
                            <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDateTime(application.zone_reviewed_at)}</p>
                          </div>
                          {application.zone_remarks && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</span>
                              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                {application.zone_remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">Zone review not available</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Application status: {application.status}</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "approval" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Final Approval
                  </h2>
                  
                  {canApprove && application.status === "zone_reviewed" && application.zone_supports && !application.approved_at ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border-l-4 border-green-500">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-900 dark:text-green-100">
                          <ShieldCheck className="w-5 h-5" />
                          Admin Approval Form
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                          Generate membership number and approve this application. Once approved, a membership will be created.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                              Membership Number (Auto-Generated)
                            </label>
                            {loadingPreview ? (
                              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                <span className="text-slate-500 dark:text-slate-400">Generating membership number...</span>
                              </div>
                            ) : previewMembershipNumber ? (
                              <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-800">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono tracking-wider">
                                  {previewMembershipNumber}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                  Format: M{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, "0")}XXXXXX
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                                  System generated - cannot be edited
                                </p>
                              </div>
                            ) : (
                              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600">
                                <p className="text-slate-500 dark:text-slate-400">Unable to preview membership number</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Remarks</label>
                            <textarea
                              value={adminRemarks}
                              onChange={(e) => setAdminRemarks(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder="Enter approval remarks (optional)"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="outline" onClick={() => { setShowAdminApproval(false); setAdminRemarks(""); setPreviewMembershipNumber(null); }}>
                              Cancel
                            </Button>
                            <Button onClick={handleApprove} disabled={isPending || !previewMembershipNumber} className="bg-green-600 hover:bg-green-700">
                              {isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Approve & Generate Membership
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : application.approved_at ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border-l-4 border-green-500">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          Application Approved
                        </h3>
                        <div className="space-y-3">
                          {application.membership_number && (
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-800">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Membership Number</span>
                              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{application.membership_number}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved at</span>
                            <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDateTime(application.approved_at)}</p>
                          </div>
                          {application.admin_remarks && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</span>
                              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                {application.admin_remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">Approval not available</p>
                      {application.status === "zone_reviewed" && !application.zone_supports && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Zone review did not support this application</p>
                      )}
                      {application.status !== "zone_reviewed" && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Application status: {application.status}</p>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "certificate" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm print:shadow-none print:rounded-none">
                <div className="p-8 print:p-12 print:min-h-screen">
                  {application.status === "approved" && application.membership_number ? (
                    <div className="space-y-8 print:space-y-6">
                      {/* Certificate Header */}
                      <div className="text-center border-b-4 border-slate-800 dark:border-slate-200 pb-6 print:pb-4">
                        <Award className="w-20 h-20 mx-auto mb-4 text-slate-800 dark:text-slate-200 print:text-black" />
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 print:text-black mb-2">
                          MEMBERSHIP CERTIFICATE
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 print:text-gray-700">
                          This certifies that
                        </p>
                      </div>

                      {/* Member Name */}
                      <div className="text-center py-8 print:py-6">
                        <h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100 print:text-black mb-4">
                          {application.full_name}
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 print:text-gray-700">
                          IC Number: {application.ic_number}
                        </p>
                      </div>

                      {/* Certificate Body */}
                      <div className="text-center space-y-4 print:space-y-3">
                        <p className="text-lg text-slate-700 dark:text-slate-300 print:text-black leading-relaxed">
                          is hereby recognized as a <span className="font-bold">Full Member</span> of
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 print:text-black">
                          [PARTY NAME]
                        </p>
                        <p className="text-lg text-slate-700 dark:text-slate-300 print:text-black">
                          Membership Number: <span className="font-bold text-xl">{application.membership_number}</span>
                        </p>
                        <p className="text-lg text-slate-700 dark:text-slate-300 print:text-black">
                          Zone: {application.zone?.name} / Cawangan: {application.cawangan?.name}
                        </p>
                      </div>

                      {/* Date Section */}
                      <div className="mt-12 print:mt-8 pt-8 print:pt-6 border-t-2 border-slate-300 dark:border-slate-700 print:border-gray-400">
                        <div className="grid grid-cols-2 gap-8 print:gap-12">
                          <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600 mb-2">
                              Date of Approval
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                              {application.approved_at ? formatDate(application.approved_at) : formatDate(application.created_at)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600 mb-2">
                              Valid Until
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                              Lifetime Member
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-8 print:pt-6 border-t border-slate-200 dark:border-slate-700 print:border-gray-300">
                        <div className="flex justify-between items-end print:items-center">
                          <div className="text-center flex-1">
                            <div className="h-20 border-b-2 border-slate-400 dark:border-slate-600 print:border-gray-500 mb-2 print:h-16"></div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
                              Authorized Signature
                            </p>
                          </div>
                          {application.photo_url && (
                            <div className="ml-8 print:ml-6">
                              <img
                                src={application.photo_url}
                                alt="Member photo"
                                className="w-32 h-32 object-cover rounded-lg border-4 border-slate-300 dark:border-slate-600 print:border-gray-400 print:w-28 print:h-28"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-8 print:mt-6 text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
                            This is a system-generated certificate. For official records, please refer to the administrative office.
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 print:text-gray-500 mt-2">
                            Generated on {new Date().toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">Certificate not available</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Application must be approved to generate certificate
                      </p>
                    </div>
                  )}
                </div>

                {/* Print Button - Hidden when printing */}
                {application.status === "approved" && application.membership_number && (
                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 print:hidden">
                    <div className="flex justify-end gap-3">
                      <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Certificate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "spr" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    SPR Voter Records
                  </h2>

                  {/* Auto-link button */}
                  <div className="mb-6">
                    <Button
                      onClick={handleAutoLinkSpr}
                      disabled={autoLinking || isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {autoLinking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Auto-linking...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Auto-Link SPR Records
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Automatically link SPR voter records matching IC number: <span className="font-mono font-semibold">{application.ic_number}</span>
                    </p>
                  </div>

                  {/* Manual search */}
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Manual Search & Link</h3>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSprSearch(!showSprSearch);
                          if (!showSprSearch) {
                            setSprSearchQuery("");
                            setSprSearchResults([]);
                            setHasSearched(false);
                          }
                        }}
                      >
                        {showSprSearch ? "Hide Search" : "Show Search"}
                      </Button>
                    </div>

                    {showSprSearch && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Input
                              value={sprSearchQuery}
                              onChange={(e) => setSprSearchQuery(e.target.value)}
                              placeholder="Search by name, IC number, or address..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSearchSpr();
                                }
                              }}
                            />
                          </div>
                          <div>
                            <select
                              value={selectedVersionId || ""}
                              onChange={(e) => setSelectedVersionId(e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                        <Button onClick={handleSearchSpr} disabled={searchingSpr || !sprSearchQuery.trim()}>
                          {searchingSpr ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Search SPR Records
                            </>
                          )}
                        </Button>

                        {/* Search results */}
                        {hasSearched && (
                          <div className="mt-4 space-y-2">
                            {sprSearchResults.length > 0 ? (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Search Results ({sprSearchResults.length} found)
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Click "Link" to connect a record to this application
                                  </p>
                                </div>
                                <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                                  {sprSearchResults.map((voter) => {
                                    const isLinked = linkedSprVoters.some((link) => link.spr_voter_id === voter.id);
                                    return (
                                      <div
                                        key={voter.id}
                                        className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                                                {voter.nama}
                                              </p>
                                              {voter.voting_support_status && (
                                                <span
                                                  className={`text-xs px-2 py-1 rounded ${
                                                    voter.voting_support_status === "white"
                                                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                                      : voter.voting_support_status === "black"
                                                      ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                                      : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                                  }`}
                                                >
                                                  {voter.voting_support_status === "white"
                                                    ? "Supporting"
                                                    : voter.voting_support_status === "black"
                                                    ? "Not Supporting"
                                                    : "Undetermined"}
                                                </span>
                                              )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                                              <div>
                                                <span className="font-medium">IC Number:</span>{" "}
                                                <span className="font-mono">
                                                  {voter.no_kp || voter.no_kp_lama || "N/A"}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="font-medium">Version:</span> {voter.version?.name || "Unknown"}
                                              </div>
                                              {voter.no_hp && (
                                                <div>
                                                  <span className="font-medium">Phone:</span> {voter.no_hp}
                                                </div>
                                              )}
                                              {voter.nama_dun && (
                                                <div>
                                                  <span className="font-medium">DUN:</span> {voter.nama_dun}
                                                </div>
                                              )}
                                              {voter.nama_lokaliti && (
                                                <div>
                                                  <span className="font-medium">Locality:</span> {voter.nama_lokaliti}
                                                </div>
                                              )}
                                              {voter.nama_tm && (
                                                <div>
                                                  <span className="font-medium">Polling Station:</span> {voter.nama_tm}
                                                </div>
                                              )}
                                            </div>
                                            {voter.alamat && (
                                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                                <span className="font-medium">Address:</span> {voter.alamat}
                                                {voter.poskod && `, ${voter.poskod}`}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex-shrink-0">
                                            {isLinked ? (
                                              <span className="text-xs px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg font-medium flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Linked
                                              </span>
                                    ) : (
                                      <Button
                                        onClick={() => handleLinkSprVoterClick(voter)}
                                        disabled={isPending}
                                        className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                                      >
                                        <Link2 className="w-4 h-4 mr-1" />
                                        Link
                                      </Button>
                                    )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                                <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  No SPR records found
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-500">
                                  No SPR voter records match your search: <span className="font-mono font-semibold">"{sprSearchQuery}"</span>
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                                  Try searching with:
                                  <br />
                                  • Full name or partial name
                                  <br />
                                  • IC number (current or old)
                                  <br />
                                  • Address keywords
                                  <br />
                                  • Or select a specific version from the dropdown
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Linked SPR voters grouped by version */}
                  {loadingSprVoters ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                      <p className="text-slate-500 dark:text-slate-400 mt-2">Loading SPR records...</p>
                    </div>
                  ) : linkedSprVoters.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Link2 className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">No SPR records linked</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Use auto-link or manual search to link SPR voter records
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Group by version */}
                      {Array.from(
                        new Set(linkedSprVoters.map((link) => link.spr_voter.version.name))
                      ).map((versionName) => {
                        const versionLinks = linkedSprVoters.filter(
                          (link) => link.spr_voter.version.name === versionName
                        );
                        return (
                          <div key={versionName} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                {versionName}
                              </h3>
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {versionLinks.length} record{versionLinks.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="space-y-3">
                              {versionLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                          {link.spr_voter.nama}
                                        </p>
                                        {link.is_auto_linked && (
                                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                            Auto-linked
                                          </span>
                                        )}
                                        {link.spr_voter.voting_support_status && (
                                          <span
                                            className={`text-xs px-2 py-1 rounded ${
                                              link.spr_voter.voting_support_status === "white"
                                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                                : link.spr_voter.voting_support_status === "black"
                                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                            }`}
                                          >
                                            {link.spr_voter.voting_support_status === "white"
                                              ? "Supporting"
                                              : link.spr_voter.voting_support_status === "black"
                                              ? "Not Supporting"
                                              : "Undetermined"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div>
                                          <span className="font-medium">IC Number:</span> {link.spr_voter.no_kp || link.spr_voter.no_kp_lama || "N/A"}
                                        </div>
                                        <div>
                                          <span className="font-medium">Phone:</span> {link.spr_voter.no_hp || "N/A"}
                                        </div>
                                        {link.spr_voter.nama_dun && (
                                          <div>
                                            <span className="font-medium">DUN:</span> {link.spr_voter.nama_dun}
                                          </div>
                                        )}
                                        {link.spr_voter.nama_lokaliti && (
                                          <div>
                                            <span className="font-medium">Locality:</span> {link.spr_voter.nama_lokaliti}
                                          </div>
                                        )}
                                        {link.spr_voter.nama_tm && (
                                          <div>
                                            <span className="font-medium">Polling Station:</span> {link.spr_voter.nama_tm}
                                          </div>
                                        )}
                                        {link.spr_voter.saluran && (
                                          <div>
                                            <span className="font-medium">Channel:</span> {link.spr_voter.saluran}
                                          </div>
                                        )}
                                      </div>
                                      {link.spr_voter.alamat && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                          <span className="font-medium">Address:</span> {link.spr_voter.alamat}
                                          {link.spr_voter.poskod && `, ${link.spr_voter.poskod}`}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Linked {formatDateTime(link.linked_at)}
                                        {link.is_auto_linked ? " (Auto)" : " (Manual)"}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleUnlinkSprVoterClick(link)}
                                      disabled={isPending}
                                      className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "review" && (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 pb-2 border-b-2 border-slate-800 dark:border-slate-700">
                    Review History
                  </h2>
                  <div className="space-y-6">
                    {application.zone_reviewed_at ? (
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-l-4 border-blue-500">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Zone Review
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                            <p className="mt-1">
                              {application.zone_supports ? (
                                <span className="text-green-600 dark:text-green-400 font-semibold">✓ Supported</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-semibold">✗ Not Supported</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reviewed at</span>
                            <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDateTime(application.zone_reviewed_at)}</p>
                          </div>
                          {application.zone_remarks && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</span>
                              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">{application.zone_remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-slate-500 dark:text-slate-400">Zone review pending</p>
                      </div>
                    )}

                    {application.approved_at ? (
                      <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border-l-4 border-green-500">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          Admin Approval
                        </h3>
                        <div className="space-y-3">
                          {application.membership_number && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Membership Number</span>
                              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{application.membership_number}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved at</span>
                            <p className="mt-1 text-slate-900 dark:text-slate-100">{formatDateTime(application.approved_at)}</p>
                          </div>
                          {application.admin_remarks && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</span>
                              <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">{application.admin_remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                ) : application.status === "rejected" ? (
                  <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border-l-4 border-red-500">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Application Rejected
                    </h3>
                    {application.admin_remarks && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rejection Remarks</span>
                        <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          {application.admin_remarks}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-slate-500 dark:text-slate-400">Admin approval pending</p>
                    {application.status === "zone_reviewed" && !application.zone_supports && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Zone review did not support this application</p>
                    )}
                  </div>
                )}
                  </div>
                </section>
              </div>
            )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Link SPR Voter Confirmation Dialog */}
    <AlertDialog.Root open={!!linkConfirmTarget} onOpenChange={(open) => !open && setLinkConfirmTarget(null)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-[60] w-full max-w-md">
          <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
            Link SPR Voter Record
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to link{" "}
            <span className="font-semibold">{linkConfirmTarget?.nama}</span>
            {linkConfirmTarget?.version && (
              <> from <span className="font-semibold">{linkConfirmTarget.version}</span></>
            )}{" "}
            to this membership application?
            <br />
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
              This will create a permanent link between the SPR voter record and this membership application.
            </span>
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirmLinkSprVoter}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Confirm Link
                  </>
                )}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>

    {/* Unlink SPR Voter Confirmation Dialog */}
    <AlertDialog.Root open={!!unlinkConfirmTarget} onOpenChange={(open) => !open && setUnlinkConfirmTarget(null)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-[60] w-full max-w-md">
          <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
            Unlink SPR Voter Record
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to unlink{" "}
            <span className="font-semibold">{unlinkConfirmTarget?.nama}</span>
            {unlinkConfirmTarget?.version && (
              <> from <span className="font-semibold">{unlinkConfirmTarget.version}</span></>
            )}{" "}
            from this membership application?
            <br />
            <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
              This action will remove the link permanently. You can link it again later if needed.
            </span>
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleConfirmUnlinkSprVoter}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirm Unlink
                  </>
                )}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    </>
  );
}
