"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NewAidsProgramButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("showNewAidsProgramForm"));
  };

  return (
    <Button onClick={handleClick} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      New Program
    </Button>
  );
}
