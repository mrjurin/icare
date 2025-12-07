"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCheck, X, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";
import { getRoleAssignments, createRoleAssignment, deleteRoleAssignment, updateRoleAssignment, getRoles, getAssignableStaff, type RoleAssignment, type CreateRoleAssignmentInput, type Role } from "@/lib/actions/roles";
import { getZones, type Zone } from "@/lib/actions/zones";

export default function RoleAssignmentsSection() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateRoleAssignmentInput>({
    staffId: 0,
    roleId: 0,
    zoneId: 0,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentsResult, rolesResult, zonesResult, staffResult] = await Promise.all([
        getRoleAssignments(),
        getRoles(),
        getZones(),
        getAssignableStaff(),
      ]);

      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data || []);
      } else {
        console.error("Failed to load assignments:", assignmentsResult.error);
      }

      if (rolesResult.success) {
        setRoles(rolesResult.data || []);
      } else {
        console.error("Failed to load roles:", rolesResult.error);
        setError(`Failed to load roles: ${rolesResult.error || "Unknown error"}`);
      }

      if (zonesResult.success) {
        setZones(zonesResult.data || []);
      } else {
        console.error("Failed to load zones:", zonesResult.error);
      }

      if (staffResult.success) {
        setStaff(staffResult.data || []);
      } else {
        console.error("Failed to load staff:", staffResult.error);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.staffId || !formData.roleId || !formData.zoneId) {
      setError("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const result = await createRoleAssignment(formData);
      if (result.success) {
        setOpen(false);
        setFormData({ staffId: 0, roleId: 0, zoneId: 0, notes: "" });
        await loadData();
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  const handleDelete = async (assignment: RoleAssignment) => {
    if (!confirm(`Are you sure you want to remove this role assignment?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteRoleAssignment(assignment.id);
      if (result.success) {
        await loadData();
        router.refresh();
      } else {
        alert(result.error || "Failed to delete assignment");
      }
    });
  };

  const handleToggleStatus = async (assignment: RoleAssignment) => {
    const newStatus = assignment.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await updateRoleAssignment({
        id: assignment.id,
        status: newStatus,
      });
      if (result.success) {
        await loadData();
        router.refresh();
      } else {
        alert(result.error || "Failed to update assignment");
      }
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading role assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Role Assignments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assign staff to roles within zones (appointed by ADUN)
          </p>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>Assign Role</span>
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-background-dark rounded-xl shadow-xl z-[101] p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Assign Role to Staff
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isPending}
                  >
                    <option value={0}>Select staff member</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isPending}
                  >
                    <option value={0}>Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {roles.length === 0 && !loading && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      No roles available. Please create roles first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.zoneId}
                    onChange={(e) => setFormData({ ...formData, zoneId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isPending}
                  >
                    <option value={0}>Select zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this assignment"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isPending}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" disabled={isPending}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Assigning..." : "Assign Role"}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12 text-center">
          <UserCheck className="size-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No role assignments yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Assign staff to roles in zones to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Staff</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Zone</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Appointed By</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{assignment.staff_name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-gray-100">{assignment.role_name || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="size-3" />
                        {assignment.zone_name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(assignment)}
                        disabled={isPending}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${
                          assignment.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }`}
                      >
                        {assignment.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 dark:text-gray-400">{assignment.appointed_by_name || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(assignment)}
                          disabled={isPending}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                          title="Remove Assignment"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
