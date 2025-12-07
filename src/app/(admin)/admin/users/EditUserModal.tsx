"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, User, Mail, Phone, CreditCard, MapPin, Building2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { updateCommunityUser, type CommunityUser } from "@/lib/actions/communityUsers";
import { getZones } from "@/lib/actions/zones";
import { getVillages } from "@/lib/actions/villages";
import type { Zone } from "@/lib/actions/zones";
import type { Village } from "@/lib/actions/villages";

type Props = {
  user: CommunityUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditUserModal({ user, open, onOpenChange }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    icNumber: user.ic_number || "",
    zoneId: user.zone_id || 0,
    villageId: user.village_id || 0,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load zones when modal opens
  useEffect(() => {
    if (open) {
      setLoadingZones(true);
      getZones().then((result) => {
        setLoadingZones(false);
        if (result.success && result.data) {
          setZones(result.data);
        }
      });
    }
  }, [open]);

  // Load villages when zone changes
  useEffect(() => {
    if (open && formData.zoneId && formData.zoneId > 0) {
      setLoadingVillages(true);
      getVillages(formData.zoneId).then((result) => {
        setLoadingVillages(false);
        if (result.success && result.data) {
          setVillages(result.data);
          // Reset village if it's not in the new zone
          if (formData.villageId && !result.data.find((v) => v.id === formData.villageId)) {
            setFormData((prev) => ({ ...prev, villageId: 0 }));
          }
        } else {
          setVillages([]);
        }
      });
    } else if (open && (!formData.zoneId || formData.zoneId === 0)) {
      setVillages([]);
      setFormData((prev) => ({ ...prev, villageId: 0 }));
    }
  }, [open, formData.zoneId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        fullName: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        icNumber: user.ic_number || "",
        zoneId: user.zone_id || 0,
        villageId: user.village_id || 0,
      });
      setError(null);
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Invalid email format");
      return;
    }
    if (formData.icNumber.trim()) {
      const cleaned = formData.icNumber.replace(/\D/g, "");
      if (cleaned.length < 10 || cleaned.length > 12) {
        setError("IC number must be 10-12 digits");
        return;
      }
    }
    if (!formData.zoneId || formData.zoneId === 0) {
      setError("Zone is required");
      return;
    }
    if (!formData.villageId || formData.villageId === 0) {
      setError("Village is required");
      return;
    }

    startTransition(async () => {
      const result = await updateCommunityUser({
        id: user.id,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        icNumber: formData.icNumber.trim() || undefined,
        zoneId: formData.zoneId,
        villageId: formData.villageId,
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to update user");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Edit Community User
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Full Name <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    <span>Email Address <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" />
                    <span>Phone Number</span>
                  </div>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full"
                  placeholder="+60 12-345 6789"
                />
              </div>

              {/* IC Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4" />
                    <span>IC Number</span>
                  </div>
                </label>
                <Input
                  type="text"
                  value={formData.icNumber}
                  onChange={(e) => setFormData({ ...formData, icNumber: e.target.value })}
                  className="w-full"
                  placeholder="e.g., 850101-01-1234"
                />
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>Zone <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      zoneId: parseInt(e.target.value, 10),
                      villageId: 0, // Reset village when zone changes
                    });
                  }}
                  required
                  disabled={loadingZones}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={0}>Select a zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {loadingZones && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading zones...</p>
                )}
              </div>

              {/* Village */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    <span>Village <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <select
                  value={formData.villageId}
                  onChange={(e) =>
                    setFormData({ ...formData, villageId: parseInt(e.target.value, 10) })
                  }
                  required
                  disabled={loadingVillages || !formData.zoneId || formData.zoneId === 0}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={0}>
                    {loadingVillages
                      ? "Loading villages..."
                      : !formData.zoneId || formData.zoneId === 0
                        ? "Select a zone first"
                        : "Select a village"}
                  </option>
                  {villages.map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
