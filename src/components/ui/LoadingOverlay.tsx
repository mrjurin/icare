"use client";

import { Loader2 } from "lucide-react";
import { useLoadingOverlayContext } from "@/contexts/LoadingOverlayContext";

export default function LoadingOverlay() {
  const { isLoading, message } = useLoadingOverlayContext();

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      style={{ pointerEvents: "all" }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white/95 dark:bg-gray-900/95 p-8 shadow-2xl">
        <Loader2 className="size-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

