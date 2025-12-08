"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import VillageFormModal from "./VillageFormModal";
import { deleteVillage, type Village } from "@/lib/actions/villages";

type Props = {
  villages: Village[];
};

export default function VillageTable({ villages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);

  const handleDelete = (village: Village) => {
    if (!confirm(`Are you sure you want to delete "${village.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteVillage(village.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete village");
      }
    });
  };

  if (villages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <MapPin className="size-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No villages yet</h3>
        <p className="text-gray-600 mb-4">Create your first village to start organizing by location</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Village Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Zone</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Description</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Created</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {villages.map((village) => (
              <tr key={village.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{village.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">
                    {village.zones?.name || `Zone ${village.zone_id}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">{village.description || "—"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">
                    {new Date(village.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <VillageFormModal
                      village={village}
                      trigger={
                        <button
                          className="p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDelete(village)}
                      className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      title="Delete"
                      disabled={isPending}
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
