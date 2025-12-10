"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, MapPin, Vote, Navigation, AlertCircle, Loader2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createVoter,
  updateVoter,
  type SprVoter,
  type CreateVoterInput,
  type UpdateVoterInput,
} from "@/lib/actions/spr-voters";
import { useTranslations } from "next-intl";

type VoterFormModalProps = {
  versionId: number;
  voter?: SprVoter | null;
  trigger: React.ReactNode;
};

export default function VoterFormModal({ versionId, voter, trigger }: VoterFormModalProps) {
  const t = useTranslations("sprVoters.form");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getInitialFormData = (v?: SprVoter | null): Partial<CreateVoterInput> => {
    if (!v) {
      return {
        versionId,
        nama: "",
        noKp: "",
        alamat: "",
      };
    }

    return {
      versionId: v.version_id,
      noSiri: v.no_siri || undefined,
      noKp: v.no_kp || "",
      noKpLama: v.no_kp_lama || "",
      nama: v.nama,
      noHp: v.no_hp || "",
      jantina: v.jantina || "",
      tarikhLahir: v.tarikh_lahir
        ? new Date(v.tarikh_lahir).toISOString().slice(0, 10)
        : "",
      bangsa: v.bangsa || "",
      agama: v.agama || "",
      kategoriKaum: v.kategori_kaum || "",
      noRumah: v.no_rumah || "",
      alamat: v.alamat || "",
      poskod: v.poskod || "",
      daerah: v.daerah || "",
      kodLokaliti: v.kod_lokaliti || "",
      namaParlimen: v.nama_parlimen || "",
      namaDun: v.nama_dun || "",
      namaPdm: v.nama_pdm || "",
      namaLokaliti: v.nama_lokaliti || "",
      kategoriUndi: v.kategori_undi || "",
      namaTm: v.nama_tm || "",
      masaUndi: v.masa_undi || "",
      saluran: v.saluran || undefined,
      votingSupportStatus: v.voting_support_status || undefined,
      lat: v.lat || undefined,
      lng: v.lng || undefined,
    };
  };

  const [formData, setFormData] = useState<Partial<CreateVoterInput>>(() =>
    getInitialFormData(voter)
  );

  // Reset form when modal opens/closes or voter changes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setFormData(getInitialFormData(voter));
      setError(null);
      setSuccess(false);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.nama?.trim()) {
      return t("nameRequired");
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      let result;
      if (voter) {
        const updateInput: UpdateVoterInput = {
          id: voter.id,
          ...formData,
        };
        result = await updateVoter(updateInput);
      } else {
        const createInput: CreateVoterInput = {
          versionId,
          nama: formData.nama!,
          noSiri: formData.noSiri,
          noKp: formData.noKp,
          noKpLama: formData.noKpLama,
          noHp: formData.noHp,
          jantina: formData.jantina,
          tarikhLahir: formData.tarikhLahir,
          bangsa: formData.bangsa,
          agama: formData.agama,
          kategoriKaum: formData.kategoriKaum,
          noRumah: formData.noRumah,
          alamat: formData.alamat,
          poskod: formData.poskod,
          daerah: formData.daerah,
          kodLokaliti: formData.kodLokaliti,
          namaParlimen: formData.namaParlimen,
          namaDun: formData.namaDun,
          namaPdm: formData.namaPdm,
          namaLokaliti: formData.namaLokaliti,
          kategoriUndi: formData.kategoriUndi,
          namaTm: formData.namaTm,
          masaUndi: formData.masaUndi,
          saluran: formData.saluran,
          votingSupportStatus: formData.votingSupportStatus,
          lat: formData.lat,
          lng: formData.lng,
        };
        result = await createVoter(createInput);
      }

      if (!result.success) {
        setError(result.error || t("saveError"));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 500);
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              {voter ? t("editTitle") : t("addTitle")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    aria-label="Dismiss error"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
                  <div className="size-5 text-green-600 dark:text-green-400 flex-shrink-0">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    {voter ? "Voter updated successfully!" : "Voter created successfully!"}
                  </p>
                </div>
              )}

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <User className="size-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("name")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.nama || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, nama: e.target.value });
                        setError(null);
                      }}
                      required
                      disabled={isPending}
                      className={error && !formData.nama?.trim() ? "border-red-500" : ""}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("icNumber")}
                    </label>
                    <Input
                      type="text"
                      value={formData.noKp || ""}
                      onChange={(e) => setFormData({ ...formData, noKp: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., 123456789012"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("oldIcNumber")}
                    </label>
                    <Input
                      type="text"
                      value={formData.noKpLama || ""}
                      onChange={(e) => setFormData({ ...formData, noKpLama: e.target.value })}
                      disabled={isPending}
                      placeholder="Old IC number if applicable"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("phoneNumber")}
                    </label>
                    <Input
                      type="tel"
                      value={formData.noHp || ""}
                      onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., 0123456789"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("gender")}
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                      value={formData.jantina || ""}
                      onChange={(e) => setFormData({ ...formData, jantina: e.target.value })}
                      disabled={isPending}
                    >
                      <option value="">{t("selectGender")}</option>
                      <option value="L">{t("male")}</option>
                      <option value="P">{t("female")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("dateOfBirth")}
                    </label>
                    <Input
                      type="date"
                      value={formData.tarikhLahir || ""}
                      onChange={(e) => setFormData({ ...formData, tarikhLahir: e.target.value })}
                      disabled={isPending}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("race")}
                    </label>
                    <Input
                      type="text"
                      value={formData.bangsa || ""}
                      onChange={(e) => setFormData({ ...formData, bangsa: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., Melayu, Cina, India"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("religion")}
                    </label>
                    <Input
                      type="text"
                      value={formData.agama || ""}
                      onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., Islam, Buddha, Hindu"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <MapPin className="size-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Address Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("address")}
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                      value={formData.alamat || ""}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      rows={3}
                      disabled={isPending}
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("postcode")}
                    </label>
                    <Input
                      type="text"
                      value={formData.poskod || ""}
                      onChange={(e) => setFormData({ ...formData, poskod: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., 88450"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("district")}
                    </label>
                    <Input
                      type="text"
                      value={formData.daerah || ""}
                      onChange={(e) => setFormData({ ...formData, daerah: e.target.value })}
                      disabled={isPending}
                      placeholder="District name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("localityCode")}
                    </label>
                    <Input
                      type="text"
                      value={formData.kodLokaliti || ""}
                      onChange={(e) => setFormData({ ...formData, kodLokaliti: e.target.value })}
                      disabled={isPending}
                      placeholder="Locality code"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("localityName")}
                    </label>
                    <Input
                      type="text"
                      value={formData.namaLokaliti || ""}
                      onChange={(e) => setFormData({ ...formData, namaLokaliti: e.target.value })}
                      disabled={isPending}
                      placeholder="Locality name"
                    />
                  </div>
                </div>
              </div>

              {/* Voting Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <Vote className="size-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Voting Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("parliamentName")}
                    </label>
                    <Input
                      type="text"
                      value={formData.namaParlimen || ""}
                      onChange={(e) => setFormData({ ...formData, namaParlimen: e.target.value })}
                      disabled={isPending}
                      placeholder="Parliament name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("dunName")}
                    </label>
                    <Input
                      type="text"
                      value={formData.namaDun || ""}
                      onChange={(e) => setFormData({ ...formData, namaDun: e.target.value })}
                      disabled={isPending}
                      placeholder="DUN name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("pollingStation")}
                    </label>
                    <Input
                      type="text"
                      value={formData.namaTm || ""}
                      onChange={(e) => setFormData({ ...formData, namaTm: e.target.value })}
                      disabled={isPending}
                      placeholder="Polling station name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("votingTime")}
                    </label>
                    <Input
                      type="text"
                      value={formData.masaUndi || ""}
                      onChange={(e) => setFormData({ ...formData, masaUndi: e.target.value })}
                      disabled={isPending}
                      placeholder="e.g., 8:00 AM - 5:00 PM"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("channelStream")}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.saluran || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saluran: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      disabled={isPending}
                      placeholder="Channel/Stream number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      {t("votingSupportStatus")}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {[
                        { value: "white", label: t("whiteFullSupport"), color: "bg-white border-gray-400 text-gray-900" },
                        { value: "black", label: t("blackNotSupporting"), color: "bg-gray-900 border-gray-700 text-white" },
                        { value: "red", label: t("redNotDetermined"), color: "bg-red-600 border-red-700 text-white" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              votingSupportStatus:
                                formData.votingSupportStatus === option.value
                                  ? null
                                  : (option.value as "white" | "black" | "red"),
                            })
                          }
                          disabled={isPending}
                          className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all
                            ${
                              formData.votingSupportStatus === option.value
                                ? option.color + " shadow-md ring-2 ring-offset-2 ring-primary/20"
                                : option.value === "white"
                                ? "bg-gray-50 border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                : option.value === "black"
                                ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                : "bg-red-50 border-red-300 text-red-600 hover:bg-red-600 hover:border-red-700 hover:text-white dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                            }
                            ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          `}
                        >
                          <span className="font-bold text-base">
                            {option.value === "white" ? "W" : option.value === "black" ? "B" : "R"}
                          </span>
                          <span className="hidden sm:inline">{option.label.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t("votingSupportLegend")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <Navigation className="size-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Location Coordinates
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("latitude")}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lat !== undefined && formData.lat !== null ? formData.lat : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lat: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      disabled={isPending}
                      placeholder="e.g., 5.9804"
                      min="-90"
                      max="90"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Latitude between -90 and 90
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      {t("longitude")}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.lng !== undefined && formData.lng !== null ? formData.lng : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lng: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      disabled={isPending}
                      placeholder="e.g., 116.0735"
                      min="-180"
                      max="180"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Longitude between -180 and 180
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    {tCommon("cancel")}
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {voter ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    voter ? t("updateVoter") : t("createVoter")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
