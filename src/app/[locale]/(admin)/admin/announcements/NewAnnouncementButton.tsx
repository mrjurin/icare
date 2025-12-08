"use client";

import { Plus } from "lucide-react";
import AnnouncementFormModal from "./AnnouncementFormModal";

export default function NewAnnouncementButton() {
  return (
    <AnnouncementFormModal
      trigger={
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold hover:bg-primary/90"
        >
          <Plus className="size-5" />
          <span>New Announcement</span>
        </button>
      }
    />
  );
}
