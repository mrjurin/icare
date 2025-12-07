"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, UserPlus, Save, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createStaff,
  updateStaff,
  type Staff,
  type StaffRole,
  type CreateStaffInput,
} from "@/lib/actions/staff";
import { getZones, type Zone } from "@/lib/actions/zones";

type Props = {
  trigger: ReactNode;
  staff?: Staff;
};

export default function StaffFormModal({ trigger, staff }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);

  const isEdit = !!staff;

  const [formData, setFormData] = useState<CreateStaffInput>({
    name: staff?.name || "",
    email: staff?.email || "",
    icNumber: (staff as any)?.ic_number || "",
    phone: staff?.phone || "",
    role: staff?.role || "staff",
    position: staff?.position || "",
    zoneId: (staff as any)?.zone_id || undefined,
    password: "", // Password field for new staff or password reset
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch zones when modal opens
  useEffect(() => {
    if (open) {
      getZones().then((result) => {
        if (result.success && result.data) {
          setZones(result.data);
        }
      });
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      setFormData({
        name: staff?.name || "",
        email: staff?.email || "",
        icNumber: (staff as any)?.ic_number || "",
        phone: staff?.phone || "",
        role: staff?.role || "staff",
        position: staff?.position || "",
        zoneId: (staff as any)?.zone_id || undefined,
        password: "", // Don't pre-fill password
      });
      setShowPassword(false);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one identifier is provided
    if (!formData.email?.trim() && !formData.icNumber?.trim()) {
      setError("Either email or IC number must be provided");
      return;
    }

    // Validate email format if provided
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError("Invalid email format");
        return;
      }
    }

    // For new staff, password is required
    if (!isEdit && !formData.password?.trim()) {
      setError("Initial password is required for new staff members");
      return;
    }

    startTransition(async () => {
      let result;
      if (isEdit && staff) {
        // For updates, only include password if it's provided
        const updateData: any = {
          id: staff.id,
          name: formData.name,
          email: formData.email || undefined,
          icNumber: formData.icNumber || undefined,
          phone: formData.phone,
          role: formData.role,
          position: formData.position,
          zoneId: formData.zoneId,
        };
        // Only include password if it's provided
        if (formData.password?.trim()) {
          updateData.password = formData.password;
        }
        result = await updateStaff(updateData);
      } else {
        result = await createStaff(formData);
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Staff Member" : "Add New Staff Member"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Ahmad bin Abdullah"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g., ahmad@example.com (optional if IC number provided)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Either email or IC number is required. Staff can login using either.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IC Number
              </label>
              <Input
                type="text"
                placeholder="e.g., 123456789012 (optional if email provided)"
                value={formData.icNumber}
                onChange={(e) => setFormData({ ...formData, icNumber: e.target.value })}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Malaysian IC number. Staff can login using this if they don't have an email.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="e.g., +60 12-345 6789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                System Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as StaffRole;
                  setFormData({ 
                    ...formData, 
                    role: newRole,
                    // Clear zoneId if role is not zone_leader
                    zoneId: newRole === "zone_leader" ? formData.zoneId : undefined,
                  });
                }}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                required
              >
                <option value="adun">ADUN (Ahli Dewan Undangan Negeri)</option>
                <option value="super_admin">Super Admin</option>
                <option value="zone_leader">Zone Leader</option>
                <option value="staff_manager">Staff Manager</option>
                <option value="staff">Staff</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.role === "adun" && "The elected representative for this constituency. Determines system access and permissions."}
                {formData.role === "super_admin" && "Can see all zones and manage all data. Full system access."}
                {formData.role === "zone_leader" && "Responsible for registering households in their assigned zone. Zone-specific access."}
                {formData.role === "staff_manager" && "Manages and coordinates staff activities. Administrative access."}
                {formData.role === "staff" && "Regular staff member who handles issues. Standard access."}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                Note: System roles determine access permissions. Organizational roles (e.g., Ketua Cawangan, Ketua Kampung) can be assigned separately in the Roles section.
              </p>
            </div>

            {formData.role === "zone_leader" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.zoneId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zoneId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  required={formData.role === "zone_leader"}
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {zones.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No zones available. Create zones first.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position / Title
              </label>
              <Input
                type="text"
                placeholder="e.g., Community Relations Officer"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEdit ? "Reset Password" : "Initial Password"}
                {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={isEdit ? "Leave blank to keep current password" : "Enter initial password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-10"
                  required={!isEdit}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {isEdit 
                  ? "Enter a new password to reset it, or leave blank to keep the current password."
                  : "This will be the initial password for the staff member. They can change it after logging in."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isEdit ? (
                  <Save className="size-4" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {isEdit ? "Save Changes" : "Add Staff"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
