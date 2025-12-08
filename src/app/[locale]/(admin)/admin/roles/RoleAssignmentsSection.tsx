"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCheck, X, MapPin, Eye, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { getRoleAssignments, createRoleAssignment, deleteRoleAssignment, updateRoleAssignment, getRoles, getAssignableStaff, type RoleAssignment, type CreateRoleAssignmentInput, type Role } from "@/lib/actions/roles";
import { getZones, type Zone } from "@/lib/actions/zones";
import { getVillages, type Village } from "@/lib/actions/villages";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function RoleAssignmentsSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<RoleAssignment | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<RoleAssignment | null>(null);

  const [selectedVillageIds, setSelectedVillageIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<CreateRoleAssignmentInput>({
    staffId: 0,
    roleId: 0,
    zoneId: 0,
    villageId: null,
    fromDate: null,
    toDate: null,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({ staffId: 0, roleId: 0, zoneId: 0, villageId: null, fromDate: null, toDate: null, notes: "" });
      setVillages([]);
      setSelectedVillageIds([]);
      setError(null);
      setLoadingVillages(false);
    }
  }, [open]);

  // Load villages when zone is selected
  useEffect(() => {
    if (!open) return;

    // Load villages whenever a zone is selected
    if (formData.zoneId > 0 && !loadingVillages) {
      // Check if villages are already loaded for this zone
      const hasVillagesForZone = villages.some(v => v.zone_id === formData.zoneId);
      
      if (!hasVillagesForZone) {
        const loadVillagesForZone = async () => {
          setLoadingVillages(true);
          setError(null);
          try {
            console.log(`Loading villages for zone ${formData.zoneId}`);
            const villagesResult = await getVillages(formData.zoneId);
            if (villagesResult.success) {
              const loadedVillages = villagesResult.data || [];
              console.log(`Loaded ${loadedVillages.length} villages for zone ${formData.zoneId}`);
              setVillages(loadedVillages);
              if (loadedVillages.length === 0) {
                console.warn(`No villages found for zone ${formData.zoneId}`);
              }
            } else {
              console.error("Failed to load villages:", villagesResult.error);
              setError(villagesResult.error || "Failed to load villages for this zone");
              setVillages([]);
            }
          } catch (err) {
            console.error("Error loading villages:", err);
            setError("An error occurred while loading villages");
            setVillages([]);
          } finally {
            setLoadingVillages(false);
          }
        };
        loadVillagesForZone();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.zoneId, open]);

  useEffect(() => {
    setMounted(true);
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

    const selectedRole = roles.find(r => r.id === formData.roleId);
    const isVillageChief = selectedRole?.name === "Village Chief";
    const isBranchChief = selectedRole?.name === "Branch Chief";

    // Check if Village Chief role requires village
    if (isVillageChief && selectedVillageIds.length === 0) {
      setError("Village Chief appointment requires a village to be selected");
      return;
    }

    // For Branch Chief, if villages are selected, create assignments for each
    // For Village Chief, only one village should be selected
    if (isVillageChief && selectedVillageIds.length > 1) {
      setError("Village Chief can only be assigned to one village");
      return;
    }

    startTransition(async () => {
      try {
        // Determine which villages to create assignments for
        // If villages are selected, create assignments for each village
        // Otherwise, create a zone-level assignment (no village)
        const villagesToAssign = selectedVillageIds.length > 0
          ? selectedVillageIds
          : [null]; // No village (zone-level assignment)

        const results = await Promise.all(
          villagesToAssign.map(villageId =>
            createRoleAssignment({
              ...formData,
              villageId: villageId || undefined,
            })
          )
        );

        // Check if all succeeded
        const failed = results.find(r => !r.success);
        if (failed) {
          setError(failed.error || "An error occurred while creating assignments");
          return;
        }

        setOpen(false);
        setFormData({ staffId: 0, roleId: 0, zoneId: 0, villageId: null, fromDate: null, toDate: null, notes: "" });
        setVillages([]);
        setSelectedVillageIds([]);
        setError(null);
        await loadData();
        router.refresh();
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
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

  const handleToggleStatusClick = (assignment: RoleAssignment) => {
    setPendingStatusChange(assignment);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    
    const newStatus = pendingStatusChange.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await updateRoleAssignment({
        id: pendingStatusChange.id,
        status: newStatus,
      });
      if (result.success) {
        await loadData();
        router.refresh();
      } else {
        alert(result.error || "Failed to update assignment");
      }
      setPendingStatusChange(null);
    });
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  const handleViewDetails = (assignment: RoleAssignment) => {
    setSelectedAssignment(assignment);
    setDetailsOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || loading) {
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Role Appointments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Appoint staff to Branch Chief and Village Chief positions in zones and villages. Village Chief requires a specific village (one per village). Branch Chief can manage multiple villages.
          </p>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button className="gap-2">
              <Plus className="size-5" />
              <span>New Appointment</span>
            </Button>
          </Dialog.Trigger>
          {mounted && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-background-dark rounded-xl shadow-xl z-[101] p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Appoint Staff to Role
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Appoint staff members to Branch Chief and Village Chief positions in zones and villages
                  </Dialog.Description>
                </div>
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
                  <SearchableSelect
                    options={staff.map((s) => ({
                      value: s.id,
                      label: s.name || "Unknown",
                      description: s.email || undefined,
                    }))}
                    value={formData.staffId ?? 0}
                    onChange={(val) => setFormData({ ...formData, staffId: typeof val === "number" ? val : parseInt(String(val)) })}
                    placeholder="Select staff member"
                    searchPlaceholder="Search by name or email..."
                    required
                    disabled={isPending}
                    emptyMessage="No staff members found"
                    name="staffId"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => {
                      const roleId = parseInt(e.target.value);
                      setFormData({ ...formData, roleId, villageId: null });
                      setSelectedVillageIds([]);
                    }}
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
                    onChange={async (e) => {
                      const zoneId = parseInt(e.target.value);
                      setFormData({ ...formData, zoneId, villageId: null });
                      setSelectedVillageIds([]);
                      setVillages([]); // Clear villages immediately when zone changes
                      setError(null); // Clear previous errors
                      // Load villages for this zone
                      if (zoneId > 0) {
                        setLoadingVillages(true);
                        try {
                          const villagesResult = await getVillages(zoneId);
                          if (villagesResult.success) {
                            setVillages(villagesResult.data || []);
                            if ((villagesResult.data || []).length === 0) {
                              console.warn(`No villages found for zone ${zoneId}`);
                            }
                          } else {
                            console.error("Failed to load villages:", villagesResult.error);
                            setError(villagesResult.error || "Failed to load villages for this zone");
                            setVillages([]);
                          }
                        } catch (err) {
                          console.error("Error loading villages:", err);
                          setError("An error occurred while loading villages");
                          setVillages([]);
                        } finally {
                          setLoadingVillages(false);
                        }
                      } else {
                        setVillages([]);
                        setLoadingVillages(false);
                      }
                    }}
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

                {/* Village selection - shown when zone is selected */}
                {formData.zoneId > 0 && (
                  <div>
                    {(() => {
                      const selectedRole = roles.find(r => r.id === formData.roleId);
                      const isVillageChief = selectedRole?.name === "Village Chief";
                      const isBranchChief = selectedRole?.name === "Branch Chief";
                      const isVillageRequired = isVillageChief;
                      
                      return (
                        <>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {isVillageChief ? (
                              <>Village <span className="text-red-500">*</span></>
                            ) : isBranchChief ? (
                              <>
                                Villages <span className="text-gray-500 text-xs font-normal">(Select villages this Branch Chief will manage)</span>
                              </>
                            ) : (
                              <>
                                Villages <span className="text-gray-500 text-xs font-normal">(Optional - select villages for this role assignment)</span>
                              </>
                            )}
                          </label>
                          {loadingVillages ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Loading villages...
                            </p>
                          ) : villages.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No villages found in this zone
                            </p>
                          ) : (
                            <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 p-3 max-h-60 overflow-y-auto">
                              {villages.map((village) => {
                                const isChecked = selectedVillageIds.includes(village.id);
                                return (
                                  <label
                                    key={village.id}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          if (isVillageChief) {
                                            // Village Chief can only select one village
                                            setSelectedVillageIds([village.id]);
                                            setFormData({ ...formData, villageId: village.id });
                                          } else {
                                            // Other roles can select multiple
                                            setSelectedVillageIds([...selectedVillageIds, village.id]);
                                          }
                                        } else {
                                          setSelectedVillageIds(selectedVillageIds.filter(id => id !== village.id));
                                          if (isVillageChief) {
                                            setFormData({ ...formData, villageId: null });
                                          }
                                        }
                                      }}
                                      disabled={isPending}
                                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">{village.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {isVillageRequired && selectedVillageIds.length === 0 && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Please select a village (required for Village Chief)
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate || ""}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isPending}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Start date of appointment (optional)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={formData.toDate || ""}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value || null })}
                      min={formData.fromDate || undefined}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isPending}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      End date of appointment (optional, leave empty for ongoing)
                    </p>
                  </div>
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
                    {isPending ? "Appointing..." : "Appoint Staff"}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
          )}
        </Dialog.Root>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12 text-center">
          <UserCheck className="size-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No appointments yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Appoint staff to Branch Chief or Village Chief positions to get started</p>
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
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Village</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Appointed</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{assignment.staff_name || "Unknown"}</div>
                      {assignment.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]" title={assignment.notes}>
                          {assignment.notes}
                        </div>
                      )}
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
                      <div className="text-gray-600 dark:text-gray-400">
                        {assignment.village_name ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                            {assignment.village_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">Zone-level</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Switch.Root
                          checked={assignment.status === "active"}
                          onCheckedChange={() => handleToggleStatusClick(assignment)}
                          disabled={isPending}
                          className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-gray-300 dark:bg-gray-700 data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-5 rounded-full bg-white shadow transition-transform duration-200" />
                        </Switch.Root>
                        <span className={`text-xs font-medium ${
                          assignment.status === "active"
                            ? "text-green-800 dark:text-green-300"
                            : "text-red-800 dark:text-red-300"
                        }`}>
                          {assignment.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 dark:text-gray-400">
                        {assignment.appointed_by_name || "—"}
                      </div>
                      {assignment.appointed_at && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(assignment.appointed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(assignment)}
                          disabled={isPending}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </button>
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

      {/* Details Modal */}
      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-background-dark rounded-xl shadow-xl z-[101] max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-full print:max-h-none">
            <div className="p-6 print:p-8">
              <div className="flex items-center justify-between mb-6 print:hidden">
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Appointment Details
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Detailed information about the role appointment
                  </Dialog.Description>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Print"
                  >
                    <Printer className="size-5" />
                  </button>
                  <Dialog.Close asChild>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>

              {selectedAssignment && (
                <div className="space-y-6 print:space-y-4">
                  {/* Header Section */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4 print:pb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 print:text-xl">
                      Role Appointment Certificate
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 print:text-xs">
                      Appointment Reference: #{selectedAssignment.id}
                    </p>
                  </div>

                  {/* Staff Information Section */}
                  <div className="space-y-4 print:space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 print:text-base print:pb-1">
                      Staff Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Staff Member
                        </label>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.staff_name || "Unknown"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Staff ID
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          #{selectedAssignment.staff_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Information Section */}
                  <div className="space-y-4 print:space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 print:text-base print:pb-1">
                      Appointment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Role
                        </label>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.role_name || "Unknown"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Status
                        </label>
                        <p className="text-base print:text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              selectedAssignment.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                            }`}
                          >
                            {selectedAssignment.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Zone
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.zone_name || "Unknown"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Village
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.village_name || (
                            <span className="text-gray-400 dark:text-gray-500 italic">Zone-level assignment</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          From Date
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.from_date
                            ? new Date(selectedAssignment.from_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : selectedAssignment.appointed_at
                            ? new Date(selectedAssignment.appointed_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          To Date
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.to_date
                            ? new Date(selectedAssignment.to_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : (
                              <span className="text-gray-400 dark:text-gray-500 italic">Ongoing</span>
                            )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Appointed By
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.appointed_by_name || "—"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                          Appointment Date
                        </label>
                        <p className="text-base text-gray-900 dark:text-gray-100 print:text-sm">
                          {selectedAssignment.appointed_at
                            ? new Date(selectedAssignment.appointed_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {selectedAssignment.notes && (
                    <div className="space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700 print:pt-2">
                      <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 print:text-[10px]">
                        Notes
                      </label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap print:text-xs">
                        {selectedAssignment.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer for Print */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 print:pt-4 print:mt-8">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center print:text-[10px]">
                      This is a system-generated document. For official records, please refer to the administrative office.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2 print:text-[10px]">
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
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer className="size-4" />
                  Print
                </button>
                <Dialog.Close asChild>
                  <Button variant="outline">Close</Button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog.Root open={!!pendingStatusChange} onOpenChange={(open) => !open && handleCancelStatusChange()}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-background-dark rounded-xl p-6 shadow-xl z-[101] w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Status Change
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to change the status of{" "}
              <span className="font-semibold">{pendingStatusChange?.staff_name || "this assignment"}</span> from{" "}
              <span className="font-semibold">
                {pendingStatusChange?.status === "active" ? "Active" : "Inactive"}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {pendingStatusChange?.status === "active" ? "Inactive" : "Active"}
              </span>?
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={handleCancelStatusChange} disabled={isPending}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={handleConfirmStatusChange} disabled={isPending}>
                  {isPending ? "Updating..." : "Confirm"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
