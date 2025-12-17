"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  getPermissions,
  getStaffPermissions,
  grantPermission,
  revokePermission,
  type Permission,
  type StaffPermission,
} from "@/lib/actions/permissions";
import { type Staff } from "@/lib/actions/staff";

type Props = {
  trigger: ReactNode;
  staff: Staff;
};

export default function StaffPermissionsModal({ trigger, staff }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load permissions and staff permissions when modal opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      Promise.all([
        getPermissions(),
        getStaffPermissions(staff.id),
      ]).then(([permsResult, staffPermsResult]) => {
        if (permsResult.success && permsResult.data) {
          setPermissions(permsResult.data);
          if (permsResult.data.length === 0) {
            setError("No permissions found. Please run the migration to create default permissions.");
          }
        } else {
          setError(permsResult.error || "Failed to load permissions");
          console.error("Failed to load permissions:", permsResult.error);
        }
        if (staffPermsResult.success && staffPermsResult.data) {
          setStaffPermissions(staffPermsResult.data);
        } else {
          // Don't set error for staff permissions if it's just empty
          if (staffPermsResult.error && !staffPermsResult.error.includes("Access denied")) {
            setError(staffPermsResult.error || "Failed to load staff permissions");
            console.error("Failed to load staff permissions:", staffPermsResult.error);
          }
        }
        setLoading(false);
      }).catch((err) => {
        console.error("Error loading permissions:", err);
        setError("An unexpected error occurred while loading permissions");
        setLoading(false);
      });
    }
  }, [open, staff.id]);

  const handleGrantPermission = (permissionId: number) => {
    setError(null);
    startTransition(async () => {
      const result = await grantPermission(staff.id, permissionId);
      if (result.success) {
        // Reload staff permissions
        const staffPermsResult = await getStaffPermissions(staff.id);
        if (staffPermsResult.success && staffPermsResult.data) {
          setStaffPermissions(staffPermsResult.data);
        }
        router.refresh();
      } else {
        setError(result.error || "Failed to grant permission");
      }
    });
  };

  const handleRevokePermission = (staffPermissionId: number) => {
    setError(null);
    startTransition(async () => {
      const result = await revokePermission(staffPermissionId);
      if (result.success) {
        // Reload staff permissions
        const staffPermsResult = await getStaffPermissions(staff.id);
        if (staffPermsResult.success && staffPermsResult.data) {
          setStaffPermissions(staffPermsResult.data);
        }
        router.refresh();
      } else {
        setError(result.error || "Failed to revoke permission");
      }
    });
  };

  const hasPermission = (permissionId: number): boolean => {
    return staffPermissions.some((sp) => sp.permission_id === permissionId);
  };

  const getStaffPermission = (permissionId: number): StaffPermission | undefined => {
    return staffPermissions.find((sp) => sp.permission_id === permissionId);
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    const category = perm.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="size-5" />
              Manage Permissions - {staff.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No permissions found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Please run the migration to create default permissions:
                </p>
                <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  npm run drizzle:migrate
                </code>
              </div>
            ) : Object.keys(permissionsByCategory).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No permissions available
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 capitalize">
                      {category.replace("_", " ")}
                    </h3>
                    <div className="space-y-2">
                      {perms.map((permission) => {
                        const hasPerm = hasPermission(permission.id);
                        const staffPerm = getStaffPermission(permission.id);
                        return (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {permission.name}
                                </h4>
                                {hasPerm && (
                                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                              {permission.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {permission.description}
                                </p>
                              )}
                              {staffPerm?.granted_by_name && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Granted by {staffPerm.granted_by_name} on{" "}
                                  {new Date(staffPerm.granted_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              {hasPerm ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleRevokePermission(staffPerm!.id)}
                                  disabled={isPending}
                                  className="h-8 px-3 gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <XCircle className="size-4" />
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => handleGrantPermission(permission.id)}
                                  disabled={isPending}
                                  className="h-8 px-3 gap-2"
                                >
                                  <CheckCircle2 className="size-4" />
                                  Grant
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Close
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}














