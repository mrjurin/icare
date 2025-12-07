"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit2, Trash2, MapPin, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import ZoneFormModal from "./ZoneFormModal";
import { deleteZone, type Zone } from "@/lib/actions/zones";

type Props = {
  zones: Zone[];
  villageCounts?: Record<number, number>;
};

export default function ZoneTable({ zones, villageCounts = {} }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const handleDelete = (zone: Zone) => {
    if (!confirm(`Are you sure you want to delete "${zone.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteZone(zone.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete zone");
      }
    });
  };

  if (zones.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <MapPin className="size-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No zones yet</h3>
        <p className="text-gray-600 mb-4">Create your first zone to start organizing households</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Zone Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Description</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Villages</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600">Created</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{zone.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">{zone.description || "—"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">{villageCounts[zone.id] || 0}</span>
                    <Link
                      href={`/admin/zones/${zone.id}`}
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      <Eye className="size-3" />
                      View
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">
                    {new Date(zone.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <ZoneFormModal
                      zone={zone}
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
                      onClick={() => handleDelete(zone)}
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
