"use client";

import { useState, useEffect } from "react";
import { Edit3, Eye, Loader2, Languages } from "lucide-react";
import { type PageLayout } from "@/lib/actions/pages";
import { getContentBlocks, type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { getPageType } from "@/lib/types/page-builder";
import DragDropEditor from "./DragDropEditor";

interface PageBuilderEditorProps {
  page: PageLayout;
  onPageUpdate: () => void;
}

export default function PageBuilderEditor({ page, onPageUpdate }: PageBuilderEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlockWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [currentLocale, setCurrentLocale] = useState('en');

  const pageType = getPageType(page.pageType);

  useEffect(() => {
    loadBlocks();
  }, [page.id]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getContentBlocks(page.id);
      if (result.success && result.data) {
        setBlocks(result.data);
      } else {
        setError(result.error || "Failed to load content blocks");
      }
    } catch (err) {
      setError("Failed to load content blocks");
      console.error("Error loading blocks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlocksChange = (newBlocks: ContentBlockWithTranslations[]) => {
    setBlocks(newBlocks);
    onPageUpdate();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-12">
        <div className="flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading editor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {page.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {page.route} • {blocks.length} blocks • {pageType?.name || page.pageType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="size-4 text-gray-500" />
            <select
              value={currentLocale}
              onChange={(e) => setCurrentLocale(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
            </select>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !previewMode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Edit3 className="size-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                previewMode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Eye className="size-4 mr-2" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark overflow-hidden">
        {previewMode ? (
          <div className="p-8">
            <div className="text-center py-12">
              <Eye className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Preview Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Preview functionality will be implemented in the next phase.
              </p>
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
                <p>Current blocks ({blocks.length}):</p>
                {blocks.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {blocks.map(block => (
                      <li key={block.id} className="flex items-center justify-between">
                        <span>{block.blockType} - {block.blockKey}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          block.isVisible 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {block.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[600px]">
            <DragDropEditor
              pageId={page.id}
              pageTypeId={page.pageType}
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onBlocksChange={handleBlocksChange}
              onSelectBlock={setSelectedBlockId}
              locale={currentLocale}
            />
          </div>
        )}
      </div>
    </div>
  );
}