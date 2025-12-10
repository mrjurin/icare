"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createReferenceData,
  updateReferenceData,
  getReferenceDataList,
  type ReferenceData,
  type ReferenceTable,
  type CreateReferenceDataInput,
  type UpdateReferenceDataInput,
} from "@/lib/actions/reference-data";
import { getTableDisplayName } from "@/lib/utils/reference-data";
import SearchableSelect from "@/components/ui/SearchableSelect";

type ReferenceDataFormModalProps = {
  table: ReferenceTable;
  data: ReferenceData | null;
  trigger: React.ReactNode;
};

export default function ReferenceDataFormModal({
  table,
  data,
  trigger,
}: ReferenceDataFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [parliaments, setParliaments] = useState<ReferenceData[]>([]);
  const [duns, setDuns] = useState<ReferenceData[]>([]);
  const [districts, setDistricts] = useState<ReferenceData[]>([]);
  const [localities, setLocalities] = useState<ReferenceData[]>([]);
  const [pollingStations, setPollingStations] = useState<ReferenceData[]>([]);
  const [zones, setZones] = useState<ReferenceData[]>([]);
  const [cawangan, setCawangan] = useState<ReferenceData[]>([]);
  const displayName = getTableDisplayName(table);

  const [formData, setFormData] = useState<CreateReferenceDataInput>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    lat: undefined,
    lng: undefined,
  });

  // Load related data for localities, polling stations, zones, cawangan, villages, and duns
  useEffect(() => {
    if (open && (table === "localities" || table === "polling_stations" || table === "zones" || table === "cawangan" || table === "villages" || table === "duns")) {
      const loadData = async () => {
        const [parlResult, dunResult, districtResult] = await Promise.all([
          getReferenceDataList("parliaments"),
          getReferenceDataList("duns"),
          getReferenceDataList("districts"),
        ]);

        if (parlResult.success) setParliaments(parlResult.data || []);
        if (dunResult.success) setDuns(dunResult.data || []);
        if (districtResult.success) setDistricts(districtResult.data || []);

        if (table === "polling_stations") {
          const localityResult = await getReferenceDataList("localities");
          if (localityResult.success) setLocalities(localityResult.data || []);
        } else if (table === "zones") {
          const pollingStationResult = await getReferenceDataList("polling_stations");
          if (pollingStationResult.success) setPollingStations(pollingStationResult.data || []);
        } else if (table === "cawangan") {
          const zoneResult = await getReferenceDataList("zones");
          if (zoneResult.success) setZones(zoneResult.data || []);
        } else if (table === "villages") {
          const cawanganResult = await getReferenceDataList("cawangan");
          if (cawanganResult.success) setCawangan(cawanganResult.data || []);
        }
      };
      loadData();
    }
  }, [open, table]);

  // Initialize form data
  useEffect(() => {
    if (data && open) {
      setFormData({
        name: data.name || "",
        code: data.code || "",
        description: data.description || "",
        isActive: data.is_active ?? true,
        parliamentId: (data as any).parliament_id || undefined,
        dunId: (data as any).dun_id || undefined,
        districtId: (data as any).district_id || undefined,
        localityId: (data as any).locality_id || undefined,
        address: (data as any).address || "",
        pollingStationId: (data as any).polling_station_id || undefined,
        zoneId: (data as any).zone_id || undefined,
        cawanganId: (data as any).cawangan_id || undefined,
        lat: (data as any).lat !== null && (data as any).lat !== undefined ? Number((data as any).lat) : undefined,
        lng: (data as any).lng !== null && (data as any).lng !== undefined ? Number((data as any).lng) : undefined,
      });
    } else if (open) {
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
        lat: undefined,
        lng: undefined,
      });
    }
  }, [data, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Name is required");
      return;
    }

    // Validate required fields for zones, cawangan, and villages
    if (table === "zones" && !formData.dunId) {
      alert("Please select a DUN");
      return;
    }
    if (table === "cawangan" && !formData.zoneId) {
      alert("Please select a Zone");
      return;
    }
    if (table === "villages" && !formData.cawanganId) {
      alert("Please select a Cawangan");
      return;
    }

    startTransition(async () => {
      let result;
      if (data) {
        const updateInput: UpdateReferenceDataInput = {
          id: data.id,
          ...formData,
        };
        result = await updateReferenceData(table, updateInput);
      } else {
        result = await createReferenceData(table, formData);
      }

      if (!result.success) {
        alert(result.error || "Failed to save");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {data ? `Edit ${displayName}` : `Add New ${displayName}`}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            {/* Hide code field for zones and villages (they don't have code column) */}
            {(table !== "zones" && table !== "villages") && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Code
                </label>
                <Input
                  type="text"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={isPending}
                />
              </div>
            )}

            {table === "duns" && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Parliament
                </label>
                <SearchableSelect
                  options={parliaments.map((p) => ({ value: p.id, label: p.name }))}
                  value={formData.parliamentId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      parliamentId: value ? parseInt(String(value), 10) : undefined,
                    })
                  }
                  placeholder="Select parliament..."
                />
              </div>
            )}

            {table === "localities" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Parliament
                  </label>
                  <SearchableSelect
                    options={parliaments.map((p) => ({ value: p.id, label: p.name }))}
                    value={formData.parliamentId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        parliamentId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select parliament..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    DUN
                  </label>
                  <SearchableSelect
                    options={duns.map((d) => ({ value: d.id, label: d.name }))}
                    value={formData.dunId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        dunId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select DUN..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    District
                  </label>
                  <SearchableSelect
                    options={districts.map((d) => ({ value: d.id, label: d.name }))}
                    value={formData.districtId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        districtId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select district..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lat !== undefined ? formData.lat.toString() : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lat: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g., 5.9804"
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lng !== undefined ? formData.lng.toString() : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lng: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g., 116.0735"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </>
            )}

            {table === "polling_stations" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Locality
                  </label>
                  <SearchableSelect
                    options={localities.map((l) => ({ value: l.id, label: l.name }))}
                    value={formData.localityId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        localityId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select locality..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Address
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    disabled={isPending}
                  />
                </div>
              </>
            )}

            {table === "zones" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    DUN *
                  </label>
                  <SearchableSelect
                    options={duns.map((d) => ({ value: d.id, label: d.name }))}
                    value={formData.dunId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        dunId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select DUN..."
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Polling Station
                  </label>
                  <SearchableSelect
                    options={pollingStations.map((ps) => ({ 
                      value: ps.id, 
                      label: `${ps.name}${ps.code ? ` (${ps.code})` : ""}` 
                    }))}
                    value={formData.pollingStationId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        pollingStationId: value ? parseInt(String(value), 10) : undefined,
                      })
                    }
                    placeholder="Select polling station..."
                  />
                </div>
              </>
            )}

            {table === "cawangan" && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Zone <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={zones.map((z) => ({ value: z.id, label: z.name }))}
                  value={formData.zoneId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      zoneId: value ? parseInt(String(value), 10) : undefined,
                    })
                  }
                  placeholder="Select zone..."
                  required
                />
              </div>
            )}

            {table === "villages" && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Cawangan <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={cawangan.map((c) => ({ value: c.id, label: c.name }))}
                  value={formData.cawanganId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      cawanganId: value ? parseInt(String(value), 10) : undefined,
                    })
                  }
                  placeholder="Select cawangan..."
                  required
                />
              </div>
            )}

            {table === "parliaments" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lat !== undefined ? formData.lat.toString() : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lat: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 5.9804"
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lng !== undefined ? formData.lng.toString() : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lng: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 116.0735"
                    disabled={isPending}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Hide is_active checkbox for tables that don't have this column (duns, zones, villages) */}
            {table !== "duns" && table !== "zones" && table !== "villages" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={isPending}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="is-active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Active
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {data ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
