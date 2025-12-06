"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useRef, useState } from "react";
import Button from "@/components/ui/Button";

export default function MediaUploader() {
  const [uploaded, setUploaded] = useState<Array<{ url: string; type?: string; size_bytes?: number }>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const results: Array<{ url: string; type?: string; size_bytes?: number }> = [];
    for (const f of files) {
      const path = `${Date.now()}-${crypto.randomUUID()}-${f.name}`;
      const { error } = await supabase.storage.from("issue-media").upload(path, f, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from("issue-media").getPublicUrl(path);
        results.push({ url: data.publicUrl, type: f.type.startsWith("video/") ? "video" : "image", size_bytes: f.size });
      }
    }
    setUploaded((prev) => [...prev, ...results]);
  }
  return (
    <div className="mt-3">
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="text-primary font-semibold">Upload files</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Supports multiple images & videos (up to 25MB total)</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <input ref={inputRef} onChange={onFiles} multiple accept="image/*,video/*" type="file" className="sr-only" />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Select Files</Button>
          {uploaded.length > 0 && (
            <Button type="button" variant="outline" onClick={() => setUploaded([])}>Clear</Button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{uploaded.length} file(s) selected</p>
        <input type="hidden" name="mediaJson" value={JSON.stringify(uploaded)} />
      </div>
    </div>
  );
}
