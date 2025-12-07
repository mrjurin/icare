"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, UserCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import RoleFormModal from "./RoleFormModal";
import { deleteRole, type Role } from "@/lib/actions/roles";

type Props = {
  roles: Role[];
};

export default function RoleTable({ roles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleDelete = (role: Role) => {
    if (!confirm(`Are you sure you want to delete "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteRole(role.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete role");
      }
    });
  };

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12 text-center">
        <UserCheck className="size-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No roles yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first role to start assigning staff to zones</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Role Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Description</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Responsibilities</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{role.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600 dark:text-gray-400">{role.description || "—"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600 dark:text-gray-400 max-w-md">
                    {role.responsibilities || "—"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <RoleFormModal
                      role={role}
                      trigger={
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={isPending}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                      title="Delete"
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
    </div>
  );
}
