"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useRef, useState, useCallback, useEffect } from "react";
import { X, Upload, Loader2, Image as ImageIcon, Video, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB in bytes

type MediaItem = {
  url: string;
  type?: string;
  size_bytes?: number;
  name?: string;
  preview?: string; // For local preview before upload
};

export default function MediaUploader() {
  const [uploaded, setUploaded] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, [supabase]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateFiles = (files: File[]): string | null => {
    const totalSize = uploaded.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
    let newTotalSize = totalSize;

    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return `${file.name} is not a valid image or video file`;
      }
      newTotalSize += file.size;
    }

    if (newTotalSize > MAX_TOTAL_SIZE) {
      return `Total file size exceeds 25MB limit. Current: ${formatFileSize(totalSize)}, Adding: ${formatFileSize(newTotalSize - totalSize)}`;
    }

    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve("");
      }
    });
  };

  const uploadFiles = async (files: File[]) => {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("You must be logged in to upload files. Please log in and try again.");
      return;
    }

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    const results: MediaItem[] = [];
    const totalSize = uploaded.reduce((sum, item) => sum + (item.size_bytes || 0), 0);

    try {
      for (const file of files) {
        // Create preview for images
        const preview = await createPreview(file);

        const path = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("adun_inanam")
          .upload(path, file, { upsert: false });

        if (uploadError) {
          // Provide more helpful error messages
          let errorMessage = uploadError.message;
          if (uploadError.message.includes("row-level security policy")) {
            errorMessage = "Permission denied. Please ensure you are logged in and have permission to upload files. If the problem persists, contact support.";
          } else if (uploadError.message.includes("new row violates")) {
            errorMessage = "Storage permission denied. Please check your account permissions or contact support.";
          }
          setError(`Failed to upload ${file.name}: ${errorMessage}`);
          continue;
        }

        const { data } = supabase.storage.from("adun_inanam").getPublicUrl(path);
        results.push({
          url: data.publicUrl,
          type: file.type.startsWith("video/") ? "video" : "image",
          size_bytes: file.size,
          name: file.name,
          preview,
        });
      }

      setUploaded((prev) => [...prev, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );

    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setUploaded((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAll = () => {
    setUploaded([]);
    setError(null);
  };

  const totalSize = uploaded.reduce((sum, item) => sum + (item.size_bytes || 0), 0);

  return (
    <div className="mt-3 space-y-4">
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5 dark:bg-primary/10"
            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        } p-4 sm:p-6 text-center`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`rounded-full p-3 ${isDragging ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-700"}`}>
            <Upload className={`size-6 ${isDragging ? "text-primary" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-primary font-semibold">Upload files</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Supports multiple images & videos (up to 25MB total)
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Used: {formatFileSize(totalSize)} / {formatFileSize(MAX_TOTAL_SIZE)}
            </p>
            {isAuthenticated === false && (
              <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ You must be logged in to upload files
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 w-full sm:w-auto">
            <input
              ref={inputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              type="file"
              className="sr-only"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || isAuthenticated === false}
              className="gap-2 w-full sm:w-auto justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="hidden sm:inline">Uploading...</span>
                  <span className="sm:hidden">Uploading</span>
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  <span className="hidden sm:inline">Select Files</span>
                  <span className="sm:hidden">Select</span>
                </>
              )}
            </Button>
            {uploaded.length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearAll} 
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start sm:items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1 text-left break-words">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 shrink-0"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {uploaded.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {uploaded.map((item, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800"
              >
                {item.type === "video" ? (
                  <div className="flex items-center justify-center h-full">
                    <Video className="size-6 sm:size-8 text-gray-400" />
                  </div>
                ) : item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.name || `Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="size-6 sm:size-8 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1.5 sm:p-1 rounded-full bg-red-500 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 touch-manipulation"
                  type="button"
                  aria-label="Remove file"
                >
                  <X className="size-3 sm:size-3" />
                </button>
                {item.name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 sm:p-1 truncate">
                    {item.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <input type="hidden" name="mediaJson" value={JSON.stringify(uploaded.map(({ preview, ...rest }) => rest))} />
      </div>
    </div>
  );
}
