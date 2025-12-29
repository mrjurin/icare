"use client";

import { useState } from "react";
import { Plus, Settings, Eye, EyeOff, Globe, FileText, Shield, Phone, Edit3 } from "lucide-react";
import Button from "@/components/ui/Button";
import { type PageLayout } from "@/lib/actions/pages";
import { PAGE_TYPES, getPageType } from "@/lib/types/page-builder";

interface PageSelectorProps {
  pages: PageLayout[];
  selectedPageId: number | null;
  onSelectPage: (pageId: number) => void;
  onCreatePage: () => void;
  onEditPage: (pageId: number) => void;
}

const getPageTypeIcon = (pageType: string) => {
  switch (pageType) {
    case 'landing':
      return Globe;
    case 'about':
      return FileText;
    case 'privacy':
    case 'terms':
      return Shield;
    case 'contact':
      return Phone;
    default:
      return FileText;
  }
};

const getPageTypeColor = (pageType: string) => {
  switch (pageType) {
    case 'landing':
      return 'text-blue-600 dark:text-blue-400';
    case 'about':
      return 'text-green-600 dark:text-green-400';
    case 'privacy':
    case 'terms':
      return 'text-orange-600 dark:text-orange-400';
    case 'contact':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export default function PageSelector({
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onEditPage
}: PageSelectorProps) {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredPages = pages.filter(page => {
    switch (filter) {
      case 'published':
        return page.isPublished;
      case 'draft':
        return !page.isPublished;
      default:
        return true;
    }
  });

  const groupedPages = filteredPages.reduce((groups, page) => {
    const pageType = getPageType(page.pageType);
    const category = pageType?.category || 'custom';
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(page);
    return groups;
  }, {} as Record<string, PageLayout[]>);

  const categoryLabels = {
    public: 'Public Pages',
    legal: 'Legal Pages',
    functional: 'Functional Pages',
    custom: 'Custom Pages'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pages
        </h2>
        <Button
          variant="outline"
          onClick={onCreatePage}
          className="flex items-center gap-2 text-xs px-3 py-2 h-8"
        >
          <Plus className="size-3" />
          New
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-1">
        {[
          { key: 'all', label: 'All', count: pages.length },
          { key: 'published', label: 'Published', count: pages.filter(p => p.isPublished).length },
          { key: 'draft', label: 'Draft', count: pages.filter(p => !p.isPublished).length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              filter === key
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {Object.entries(groupedPages).map(([category, categoryPages]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {categoryLabels[category as keyof typeof categoryLabels] || category}
            </h3>
            <div className="space-y-1">
              {categoryPages.map(page => {
                const Icon = getPageTypeIcon(page.pageType);
                const iconColor = getPageTypeColor(page.pageType);
                const isSelected = page.id === selectedPageId;

                return (
                  <div
                    key={page.id}
                    className={`group relative rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => onSelectPage(page.id)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`size-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {page.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              {page.isPublished ? (
                                <Eye className="size-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <EyeOff className="size-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {page.route}
                          </p>
                          {page.title && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                              {page.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Settings Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPage(page.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-md transition-opacity ${
                        isSelected
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      } hover:bg-gray-100 dark:hover:bg-gray-800`}
                      title="Page Settings"
                    >
                      <Settings className="size-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredPages.length === 0 && (
          <div className="text-center py-8">
            <Edit3 className="size-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'all' 
                ? 'No pages found. Create your first page to get started.'
                : `No ${filter} pages found.`
              }
            </p>
            {filter === 'all' && (
              <Button
                variant="outline"
                onClick={onCreatePage}
                className="text-sm"
              >
                <Plus className="size-4" />
                Create Page
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}