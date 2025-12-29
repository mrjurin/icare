"use client";

import { useState, useEffect } from "react";
import { Plus, Settings, Eye, Edit3, Save, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { getAllPages, createPage, publishPage, type PageLayout } from "@/lib/actions/pages";
import { PAGE_TYPES, type PageType } from "@/lib/types/page-builder";
import { initializePageWithDefaults } from "@/lib/utils/page-builder";
import PageSelector from "./components/PageSelector";
import PageSettingsModal from "./components/PageSettingsModal";
import PageBuilderEditor from "./components/PageBuilderEditor";

export default function PageBuilderPage() {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPageId, setSettingsPageId] = useState<number | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const selectedPage = pages.find(p => p.id === selectedPageId);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const result = await getAllPages();
      if (result.success && result.data) {
        setPages(result.data);
        // Auto-select first page if none selected
        if (!selectedPageId && result.data.length > 0) {
          setSelectedPageId(result.data[0].id);
        }
      } else {
        setError(result.error || "Failed to load pages");
      }
    } catch (err) {
      setError("Failed to load pages");
      console.error("Error loading pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (pageType: string, name: string, route: string) => {
    try {
      setIsCreatingPage(true);
      setError(null);

      // Create the page
      const createResult = await createPage({
        name,
        pageType,
        route,
        isActive: true
      });

      if (!createResult.success || !createResult.data) {
        setError(createResult.error || "Failed to create page");
        return;
      }

      const newPage = createResult.data;

      // Initialize with default blocks
      const initResult = await initializePageWithDefaults(newPage.id, pageType);
      if (!initResult.success) {
        console.warn("Failed to initialize page with defaults:", initResult.error);
      }

      // Reload pages and select the new one
      await loadPages();
      setSelectedPageId(newPage.id);
      setShowSettingsModal(false);
    } catch (err) {
      setError("Failed to create page");
      console.error("Error creating page:", err);
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handlePublishPage = async () => {
    if (!selectedPageId) return;

    try {
      setIsPublishing(true);
      setError(null);

      const result = await publishPage(selectedPageId);
      if (result.success) {
        // Reload pages to update published status
        await loadPages();
      } else {
        setError(result.error || "Failed to publish page");
      }
    } catch (err) {
      setError("Failed to publish page");
      console.error("Error publishing page:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const openPageSettings = (pageId?: number) => {
    setSettingsPageId(pageId || null);
    setShowSettingsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-gray-600 dark:text-gray-400">Loading page builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            Page Builder
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and customize your website pages with drag-and-drop editing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => openPageSettings()}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            New Page
          </Button>
          {selectedPage && (
            <>
              <Button
                variant="outline"
                onClick={() => openPageSettings(selectedPage.id)}
                className="flex items-center gap-2"
              >
                <Settings className="size-4" />
                Settings
              </Button>
              <Button
                onClick={handlePublishPage}
                disabled={isPublishing || selectedPage.isPublished}
                className="flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publishing...
                  </>
                ) : selectedPage.isPublished ? (
                  <>
                    <Eye className="size-4" />
                    Published
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Publish
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selector Sidebar */}
        <div className="lg:col-span-1">
          <PageSelector
            pages={pages}
            selectedPageId={selectedPageId}
            onSelectPage={setSelectedPageId}
            onCreatePage={() => openPageSettings()}
            onEditPage={openPageSettings}
          />
        </div>

        {/* Page Editor */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <PageBuilderEditor
              page={selectedPage}
              onPageUpdate={loadPages}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12 text-center">
              <Edit3 className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Page Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a page from the sidebar to start editing, or create a new page.
              </p>
              <Button onClick={() => openPageSettings()}>
                <Plus className="size-4" />
                Create New Page
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Page Settings Modal */}
      {showSettingsModal && (
        <PageSettingsModal
          pageId={settingsPageId}
          pages={pages}
          onClose={() => {
            setShowSettingsModal(false);
            setSettingsPageId(null);
          }}
          onSave={settingsPageId ? loadPages : handleCreatePage}
          isCreating={isCreatingPage}
        />
      )}
    </div>
  );
}