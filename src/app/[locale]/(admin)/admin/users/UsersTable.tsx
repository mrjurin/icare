"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, CheckCircle2, XCircle, Clock, Link2, Unlink, AlertCircle, Pencil, Ban } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { CommunityUser } from "@/lib/actions/communityUsers";
import { verifyCommunityUser, unlinkUserFromHouseholdMember } from "@/lib/actions/communityUsers";
import type { PaginationProps } from "@/components/ui/Pagination";
import Pagination from "@/components/ui/Pagination";
import LinkHouseholdModal from "./LinkHouseholdModal";
import EditUserModal from "./EditUserModal";
import RevokeUserModal from "./RevokeUserModal";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type UsersTableProps = {
  users: CommunityUser[];
  pagination?: PaginationProps | null;
};

export default function UsersTable({ users, pagination }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [zoneFilter, setZoneFilter] = useState(searchParams.get("zone") || "");
  const [isPending, startTransition] = useTransition();
  const [verifyingUserId, setVerifyingUserId] = useState<number | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedUserForLink, setSelectedUserForLink] = useState<CommunityUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<CommunityUser | null>(null);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedUserForRevoke, setSelectedUserForRevoke] = useState<CommunityUser | null>(null);

  const updateFilters = (newSearch?: string, newStatus?: string, newZone?: string) => {
    const params = new URLSearchParams();
    const finalSearch = newSearch !== undefined ? newSearch : search;
    const finalStatus = newStatus !== undefined ? newStatus : statusFilter;
    const finalZone = newZone !== undefined ? newZone : zoneFilter;

    if (finalSearch) params.set("search", finalSearch);
    if (finalStatus) params.set("status", finalStatus);
    if (finalZone) params.set("zone", finalZone);

    const queryString = params.toString();
    router.push(queryString ? `/admin/users?${queryString}` : "/admin/users");
  };

  const handleSearch = () => {
    updateFilters();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    updateFilters(undefined, newStatus, undefined);
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZone = e.target.value;
    setZoneFilter(newZone);
    updateFilters(undefined, undefined, newZone);
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setZoneFilter("");
    router.push("/admin/users");
  };

  const handleVerify = async (userId: number, status: "verified" | "rejected") => {
    setVerifyingUserId(userId);
    startTransition(async () => {
      const result = await verifyCommunityUser(userId, status);
      if (!result.success) {
        alert(result.error || "Failed to verify user");
      }
      setVerifyingUserId(null);
      router.refresh();
    });
  };

  const handleLink = (user: CommunityUser) => {
    setSelectedUserForLink(user);
    setLinkModalOpen(true);
  };

  const handleEdit = (user: CommunityUser) => {
    setSelectedUserForEdit(user);
    setEditModalOpen(true);
  };

  const handleRevoke = (user: CommunityUser) => {
    setSelectedUserForRevoke(user);
    setRevokeModalOpen(true);
  };

  const handleUnlink = async (userId: number) => {
    if (!confirm("Are you sure you want to unlink this user from their household member?")) {
      return;
    }
    startTransition(async () => {
      const result = await unlinkUserFromHouseholdMember(userId);
      if (!result.success) {
        alert(result.error || "Failed to unlink user");
      }
      router.refresh();
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="size-3" />
            Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="size-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="size-3" />
            Pending
          </span>
        );
    }
  };

  // Get unique zones from users for filter
  const availableZones = Array.from(
    new Map(users.filter((u) => u.zone).map((u) => [u.zone!.id, u.zone!])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, IC number..."
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Zone:
            </label>
            <select
              value={zoneFilter}
              onChange={handleZoneChange}
              className="h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Zones</option>
              {availableZones.map((zone) => (
                <option key={zone.id} value={zone.id.toString()}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={handleReset} className="whitespace-nowrap">
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Location
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Household Link
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-8 text-gray-400" />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {user.full_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium">
                            {user.full_name || "N/A"}
                          </div>
                          {user.ic_number && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              IC: {user.ic_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white">{user.email || "N/A"}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white">
                        {user.village?.name || "N/A"}
                      </div>
                      {user.zone && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Zone: {user.zone.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.household_member ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.household_member.name}
                          </span>
                          <button
                            onClick={() => handleUnlink(user.id)}
                            disabled={isPending}
                            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Unlink from household"
                          >
                            <Unlink className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLink(user)}
                          disabled={isPending}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                          title="Link to household member"
                        >
                          <Link2 className="size-4" />
                          Link
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.verification_status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={isPending}
                          className="p-2 text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
                          title="Edit user"
                        >
                          <Pencil className="size-5" />
                        </button>
                        {user.verification_status === "pending" && (
                          <>
                            <button
                              onClick={() => handleVerify(user.id, "verified")}
                              disabled={isPending || verifyingUserId === user.id}
                              className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                              title="Verify user"
                            >
                              <CheckCircle2 className="size-5" />
                            </button>
                            <button
                              onClick={() => handleVerify(user.id, "rejected")}
                              disabled={isPending || verifyingUserId === user.id}
                              className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Reject user"
                            >
                              <XCircle className="size-5" />
                            </button>
                          </>
                        )}
                        {user.verification_status === "verified" && (
                          <button
                            onClick={() => handleRevoke(user)}
                            disabled={isPending}
                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Revoke verification"
                          >
                            <Ban className="size-5" />
                          </button>
                        )}
                        {user.verification_status === "rejected" && (
                          <button
                            onClick={() => handleVerify(user.id, "verified")}
                            disabled={isPending || verifyingUserId === user.id}
                            className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                            title="Approve user"
                          >
                            <CheckCircle2 className="size-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              baseUrl="/admin/users"
            />
          </div>
        )}
      </div>

      {/* Link Household Modal */}
      {selectedUserForLink && (
        <LinkHouseholdModal
          userId={selectedUserForLink.id}
          userName={selectedUserForLink.full_name || "Unknown User"}
          userZoneId={selectedUserForLink.zone_id}
          open={linkModalOpen}
          onOpenChange={(open) => {
            setLinkModalOpen(open);
            if (!open) {
              setSelectedUserForLink(null);
            }
          }}
        />
      )}

      {/* Edit User Modal */}
      {selectedUserForEdit && (
        <EditUserModal
          user={selectedUserForEdit}
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) {
              setSelectedUserForEdit(null);
            }
          }}
        />
      )}

      {/* Revoke User Modal */}
      {selectedUserForRevoke && (
        <RevokeUserModal
          userId={selectedUserForRevoke.id}
          userName={selectedUserForRevoke.full_name || "Unknown User"}
          open={revokeModalOpen}
          onOpenChange={(open) => {
            setRevokeModalOpen(open);
            if (!open) {
              setSelectedUserForRevoke(null);
            }
          }}
        />
      )}
    </>
  );
}
