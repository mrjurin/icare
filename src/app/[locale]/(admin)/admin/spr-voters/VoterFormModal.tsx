"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
    };
  };

  const [formData, setFormData] = useState<Partial<CreateVoterInput>>(() =>
    getInitialFormData(voter)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama?.trim()) {
      alert(t("nameRequired"));
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
        };
        result = await createVoter(createInput);
      }

      if (!result.success) {
        alert(result.error || t("saveError"));
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {voter ? t("editTitle") : t("addTitle")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("name")} *
                </label>
                <Input
                  type="text"
                  value={formData.nama || ""}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("icNumber")}
                </label>
                <Input
                  type="text"
                  value={formData.noKp || ""}
                  onChange={(e) => setFormData({ ...formData, noKp: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("oldIcNumber")}
                </label>
                <Input
                  type="text"
                  value={formData.noKpLama || ""}
                  onChange={(e) => setFormData({ ...formData, noKpLama: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("phoneNumber")}
                </label>
                <Input
                  type="text"
                  value={formData.noHp || ""}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("gender")}
                </label>
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("dateOfBirth")}
                </label>
                <Input
                  type="date"
                  value={formData.tarikhLahir || ""}
                  onChange={(e) => setFormData({ ...formData, tarikhLahir: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("race")}
                </label>
                <Input
                  type="text"
                  value={formData.bangsa || ""}
                  onChange={(e) => setFormData({ ...formData, bangsa: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("religion")}
                </label>
                <Input
                  type="text"
                  value={formData.agama || ""}
                  onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("address")}
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  value={formData.alamat || ""}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  rows={2}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("postcode")}
                </label>
                <Input
                  type="text"
                  value={formData.poskod || ""}
                  onChange={(e) => setFormData({ ...formData, poskod: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("district")}
                </label>
                <Input
                  type="text"
                  value={formData.daerah || ""}
                  onChange={(e) => setFormData({ ...formData, daerah: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("localityCode")}
                </label>
                <Input
                  type="text"
                  value={formData.kodLokaliti || ""}
                  onChange={(e) => setFormData({ ...formData, kodLokaliti: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("localityName")}
                </label>
                <Input
                  type="text"
                  value={formData.namaLokaliti || ""}
                  onChange={(e) => setFormData({ ...formData, namaLokaliti: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("parliamentName")}
                </label>
                <Input
                  type="text"
                  value={formData.namaParlimen || ""}
                  onChange={(e) => setFormData({ ...formData, namaParlimen: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("dunName")}
                </label>
                <Input
                  type="text"
                  value={formData.namaDun || ""}
                  onChange={(e) => setFormData({ ...formData, namaDun: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("pollingStation")}
                </label>
                <Input
                  type="text"
                  value={formData.namaTm || ""}
                  onChange={(e) => setFormData({ ...formData, namaTm: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("votingTime")}
                </label>
                <Input
                  type="text"
                  value={formData.masaUndi || ""}
                  onChange={(e) => setFormData({ ...formData, masaUndi: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("channelStream")}
                </label>
                <Input
                  type="number"
                  value={formData.saluran || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saluran: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  disabled={isPending}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  {t("votingSupportStatus")}
                </label>
                <div className="flex gap-2">
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
                            formData.votingSupportStatus === option.value ? null : (option.value as "white" | "black" | "red"),
                        })
                      }
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
                        ${
                          formData.votingSupportStatus === option.value
                            ? option.color + " shadow-md"
                            : option.value === "white"
                            ? "bg-gray-50 border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400"
                            : option.value === "black"
                            ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                            : "bg-red-50 border-red-300 text-red-600 hover:bg-red-600 hover:border-red-700 hover:text-white"
                        }
                      `}
                    >
                      <span className="font-bold">
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

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  {tCommon("cancel")}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {voter ? t("updateVoter") : t("createVoter")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
