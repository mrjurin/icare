"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Media = { url: string; type?: string | null; size_bytes?: number | null };

type ImagePreviewProps = {
  media: Media[];
  issueTitle: string;
};

export default function ImagePreview({ media, issueTitle }: ImagePreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Filter only images (not videos)
  const images = media.filter((m) => m.type !== "video");
  
  const openPreview = (index: number) => {
    setSelectedIndex(index);
  };

  const closePreview = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    if (e.key === "ArrowLeft" && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (e.key === "ArrowRight" && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (e.key === "Escape") {
      closePreview();
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => openPreview(idx)}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors cursor-pointer group"
          >
            <Image
              src={img.url ?? ""}
              alt={`${issueTitle} - Image ${idx + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <Dialog.Root open={selectedIndex !== null} onOpenChange={(open) => !open && closePreview()}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
            <Dialog.Content
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>
                  Image preview for {issueTitle} - Image {selectedIndex !== null ? selectedIndex + 1 : 1} of {images.length}
                </Dialog.Title>
              </VisuallyHidden.Root>
              <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
                {/* Close button */}
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="size-6" />
                  </button>
                </Dialog.Close>

                {/* Previous button */}
                {selectedIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                )}

                {/* Next button */}
                {selectedIndex < images.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                )}

                {/* Image */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={images[selectedIndex].url ?? ""}
                    alt={`${issueTitle} - Image ${selectedIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                  {selectedIndex + 1} / {images.length}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
