"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";

type PhotoUploadProps = {
  value?: string;
  onChange: (url: string | null) => void;
  error?: string;
};

export default function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();
      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      alert("Failed to upload photo. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Photo <span className="text-red-500">*</span>
      </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          This photo will be used for your membership certificate and card. Please use a clear, recent photo.
        </p>
      </div>
      
      {preview ? (
        <div className="relative inline-block group">
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg">
          <img
            src={preview}
            alt="Preview"
              className="w-64 h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-3 w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
          >
            Remove Photo
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`w-full max-w-md mx-auto border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            uploading
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">Uploading...</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Please wait</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Click to upload photo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG up to 5MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
