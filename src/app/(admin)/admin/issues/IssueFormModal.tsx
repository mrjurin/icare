"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Plus, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createIssue, type CreateIssueInput } from "@/lib/actions/issues";
import MediaUploader from "./MediaUploader";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getReferenceDataList, type ReferenceData } from "@/lib/actions/reference-data";

type Props = {
  trigger: React.ReactNode;
};

export default function IssueFormModal({ trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<Array<{ url: string; type?: string; size_bytes?: number }>>([]);
  const [localities, setLocalities] = useState<ReferenceData[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<string>("");
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<CreateIssueInput>({
    title: "",
    description: "",
    category: "other",
    address: "",
    lat: undefined,
    lng: undefined,
    localityId: undefined,
    status: "pending",
  });

  // Load localities when modal opens
  useEffect(() => {
    if (open) {
      const loadLocalities = async () => {
        const result = await getReferenceDataList("localities");
        if (result.success && result.data) {
          setLocalities(result.data.filter((loc) => loc.is_active));
        }
      };
      loadLocalities();
    }
  }, [open]);

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setGeocodeStatus("");
      return;
    }

    setIsGeocoding(true);
    setGeocodeStatus("Detecting location...");

    try {
      // Use Nominatim OpenStreetMap API (same as LocationCapture component)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        {
          headers: {
            "User-Agent": "iCare-Issue-Management/1.0", // Required by Nominatim usage policy
          },
        }
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const results: Array<{ lat: string; lon: string; display_name?: string }> = await response.json();

      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);

        if (!isNaN(lat) && !isNaN(lon)) {
          setFormData((prev) => ({
            ...prev,
            lat,
            lng: lon,
          }));
          setGeocodeStatus("Location detected");
          setTimeout(() => setGeocodeStatus(""), 3000);
        } else {
          setGeocodeStatus("Location not found");
        }
      } else {
        setGeocodeStatus("Location not found");
      }
    } catch (err) {
      setGeocodeStatus("Failed to detect location");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced geocoding when address changes
  useEffect(() => {
    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Only geocode if address has meaningful content (at least 5 characters)
    if (formData.address.trim().length >= 5) {
      geocodeTimeoutRef.current = setTimeout(() => {
        geocodeAddress(formData.address);
      }, 1000); // Wait 1 second after user stops typing
    } else {
      setGeocodeStatus("");
    }

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [formData.address]);

  // Manual geocode button handler
  const handleManualGeocode = () => {
    if (formData.address.trim()) {
      geocodeAddress(formData.address);
    } else {
      setGeocodeStatus("Please enter an address first");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        title: "",
        description: "",
        category: "other",
        address: "",
        lat: undefined,
        lng: undefined,
        localityId: undefined,
        status: "pending",
      });
      setMedia([]);
      setError(null);
      setGeocodeStatus("");
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    startTransition(async () => {
      const result = await createIssue({
        ...formData,
        media: media.length > 0 ? media : undefined,
      });

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to create issue");
      }
    });
  };

  const categoryOptions = [
    { value: "road_maintenance", label: "Road Maintenance" },
    { value: "drainage", label: "Drainage" },
    { value: "public_safety", label: "Public Safety" },
    { value: "sanitation", label: "Sanitation" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                Add New Issue
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Create a new issue
              </Dialog.Description>
            </div>
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
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter issue title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CreateIssueInput["category"],
                  })
                }
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-1 focus:border-primary focus:ring-primary resize-y min-h-[100px]"
                placeholder="Enter issue description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Locality (optional)
              </label>
              <SearchableSelect
                options={localities.map((loc) => ({ value: loc.id, label: loc.name }))}
                value={formData.localityId || ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    localityId: value ? Number(value) : undefined,
                  })
                }
                placeholder="Select locality..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualGeocode}
                  disabled={isGeocoding || !formData.address.trim()}
                  className="h-8 px-2 text-xs gap-1.5"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="size-3" />
                      Detect Location
                    </>
                  )}
                </Button>
              </div>
              <Input
                type="text"
                placeholder="Enter address or postcode (location will auto-detect)"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full"
              />
              {geocodeStatus && (
                <p className={`mt-1.5 text-xs ${
                  geocodeStatus.includes("detected") || geocodeStatus.includes("Location detected")
                    ? "text-green-600 dark:text-green-400"
                    : geocodeStatus.includes("not found") || geocodeStatus.includes("failed")
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}>
                  {geocodeStatus}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitude (optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 6.1234"
                  value={formData.lat ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lat: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitude (optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 116.1234"
                  value={formData.lng ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lng: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CreateIssueInput["status"],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attach Media (optional)
              </label>
              <MediaUploader onMediaChange={setMedia} />
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
                ) : (
                  <Plus className="size-4" />
                )}
                Create Issue
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
