"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { getSetting, updateSetting } from "@/lib/actions/settings";
import { useRouter } from "next/navigation";

type PageKey = "how_it_works" | "view_reports" | "about_us" | "contact";

const pageConfig: Record<PageKey, { title: string; key: string; description: string }> = {
  how_it_works: {
    title: "How It Works",
    key: "page_how_it_works_content",
    description: "Content displayed on the 'How It Works' page. This page explains how the platform works to users.",
  },
  view_reports: {
    title: "View Reports",
    key: "page_view_reports_content",
    description: "Content displayed on the 'View Reports' page. This page provides information about viewing community reports.",
  },
  about_us: {
    title: "About Us",
    key: "page_about_us_content",
    description: "Content displayed on the 'About Us' page. This page provides information about the platform and organization.",
  },
  contact: {
    title: "Contact",
    key: "page_contact_content",
    description: "Content displayed on the 'Contact' page. This page provides contact information and ways to reach out.",
  },
};

export default function AdminPagesPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Record<PageKey, string>>({
    how_it_works: "",
    view_reports: "",
    about_us: "",
    contact: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<PageKey, boolean>>({
    how_it_works: false,
    view_reports: false,
    about_us: false,
    contact: false,
  });
  const [errors, setErrors] = useState<Record<PageKey, string | null>>({
    how_it_works: null,
    view_reports: null,
    about_us: null,
    contact: null,
  });
  const [success, setSuccess] = useState<Record<PageKey, boolean>>({
    how_it_works: false,
    view_reports: false,
    about_us: false,
    contact: false,
  });

  useEffect(() => {
    async function loadContents() {
      const results = await Promise.all(
        Object.entries(pageConfig).map(async ([key, config]) => {
          const result = await getSetting(config.key);
          return {
            key: key as PageKey,
            content: result.success && result.data ? result.data : "",
          };
        })
      );

      const newContents: Record<PageKey, string> = {
        how_it_works: "",
        view_reports: "",
        about_us: "",
        contact: "",
      };

      results.forEach(({ key, content }) => {
        newContents[key] = content;
      });

      setContents(newContents);
      setLoading(false);
    }

    loadContents();
  }, []);

  const handleContentChange = (pageKey: PageKey, value: string) => {
    setContents((prev) => ({
      ...prev,
      [pageKey]: value,
    }));
    // Clear error and success for this page
    setErrors((prev) => ({
      ...prev,
      [pageKey]: null,
    }));
    setSuccess((prev) => ({
      ...prev,
      [pageKey]: false,
    }));
  };

  const handleSave = async (pageKey: PageKey) => {
    setSaving((prev) => ({
      ...prev,
      [pageKey]: true,
    }));
    setErrors((prev) => ({
      ...prev,
      [pageKey]: null,
    }));
    setSuccess((prev) => ({
      ...prev,
      [pageKey]: false,
    }));

    const config = pageConfig[pageKey];
    const result = await updateSetting(
      config.key,
      contents[pageKey],
      config.description
    );

    if (result.success) {
      setSuccess((prev) => ({
        ...prev,
        [pageKey]: true,
      }));
      setTimeout(() => {
        setSuccess((prev) => ({
          ...prev,
          [pageKey]: false,
        }));
        router.refresh();
      }, 2000);
    } else {
      setErrors((prev) => ({
        ...prev,
        [pageKey]: result.error || "Failed to save content",
      }));
    }

    setSaving((prev) => ({
      ...prev,
      [pageKey]: false,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Page Content Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Page Content Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage the content displayed on public pages. Use the rich text editor to format your content.
        </p>
      </div>

      {Object.entries(pageConfig).map(([pageKey, config]) => {
        const key = pageKey as PageKey;
        return (
          <div
            key={key}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Page Content
                </label>
                <RichTextEditor
                  value={contents[key]}
                  onChange={(value) => handleContentChange(key, value)}
                  placeholder={`Enter content for ${config.title} page...`}
                  namespace={`page-${key}`}
                />
              </div>

              {errors[key] && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors[key]}</p>
                </div>
              )}

              {success[key] && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {config.title} content saved successfully!
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="button"
                  onClick={() => handleSave(key)}
                  disabled={saving[key]}
                >
                  {saving[key] ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-5" />
                      <span>Save {config.title}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
