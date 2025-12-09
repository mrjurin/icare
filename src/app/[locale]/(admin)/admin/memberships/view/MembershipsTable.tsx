"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable, { DataTableEmpty } from "@/components/ui/DataTable";
import { Membership } from "@/lib/actions/memberships";
import MembershipDetailModal from "./MembershipDetailModal";

// Format date consistently to avoid hydration mismatches
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

type MembershipsTableProps = {
  memberships: Membership[];
};

export default function MembershipsTable({ memberships }: MembershipsTableProps) {
  const router = useRouter();
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredMemberships = memberships.filter((m) => {
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case "active":
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200`}>
            Active
          </span>
        );
      case "inactive":
        return (
          <span className={`${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200`}>
            Inactive
          </span>
        );
      case "suspended":
        return (
          <span className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200`}>
            Suspended
          </span>
        );
      case "terminated":
        return (
          <span className={`${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`}>
            Terminated
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
          <h3 className="text-lg font-semibold">All Memberships</h3>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        <DataTable emptyMessage="No memberships found">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  Membership Number
                </th>
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
                  Joined Date
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.length === 0 ? (
                <DataTableEmpty colSpan={7} message="No memberships found." />
              ) : (
                filteredMemberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {membership.membership_number}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {membership.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {membership.ic_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {membership.zone?.name} / {membership.cawangan?.name}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(membership.status)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(membership.joined_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMembership(membership)}
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

      {selectedMembership && (
        <MembershipDetailModal
          membership={selectedMembership}
          onClose={() => setSelectedMembership(null)}
        />
      )}
    </>
  );
}
