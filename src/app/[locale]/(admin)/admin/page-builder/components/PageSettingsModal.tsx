"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Globe, FileText, Shield, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { type PageLayout, getPageById, updatePageLayout } from "@/lib/actions/pages";
import { PAGE_TYPES, type PageType } from "@/lib/types/page-builder";

interface PageSettingsModalProps {
  pageId: number | null; // null for creating new page
  pages: PageLayout[];
  onClose: () => void;
  onSave: (pageType: string, name: string, route: string) => void | Promise<void>;
  isCreating?: boolean;
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

export default function PageSettingsModal({
  pageId,
  pages,
  onClose,
  onSave,
  isCreating = false
}: PageSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    pageType: 'custom',
    route: '',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = pageId !== null;
  const modalTitle = isEditing ? 'Page Settings' : 'Create New Page';

  useEffect(() => {
    if (isEditing && pageId) {
      loadPageData();
    } else {
      // Reset form for new page
      setFormData({
        name: '',
        pageType: 'custom',
        route: '',
        title: '',
        description: ''
      });
    }
  }, [pageId, isEditing]);

  const loadPageData = async () => {
    if (!pageId) return;

    try {
      setLoading(true);
      const result = await getPageById(pageId);
      if (result.success && result.data) {
        const page = result.data;
        setFormData({
          name: page.name,
          pageType: page.pageType,
          route: page.route,
          title: page.title || '',
          description: page.description || ''
        });
      } else {
        setError(result.error || 'Failed to load page data');
      }
    } catch (err) {
      setError('Failed to load page data');
      console.error('Error loading page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Page name is required');
      return;
    }

    if (!formData.route.trim()) {
      setError('Route is required');
      return;
    }

    // Check for route conflicts (excluding current page)
    const routeConflict = pages.find(p => 
      p.route === formData.route.trim() && p.id !== pageId
    );
    if (routeConflict) {
      setError('A page with this route already exists');
      return;
    }

    // Validate route format
    if (!formData.route.startsWith('/')) {
      setError('Route must start with /');
      return;
    }

    try {
      setSaving(true);

      if (isEditing && pageId) {
        // Update existing page
        const result = await updatePageLayout({
          id: pageId,
          name: formData.name.trim(),
          pageType: formData.pageType,
          route: formData.route.trim(),
          title: formData.title.trim() || undefined,
          description: formData.description.trim() || undefined
        });

        if (result.success) {
          onSave(formData.pageType, formData.name.trim(), formData.route.trim());
        } else {
          setError(result.error || 'Failed to update page');
        }
      } else {
        // Create new page
        await onSave(formData.pageType, formData.name.trim(), formData.route.trim());
      }
    } catch (err) {
      setError(isEditing ? 'Failed to update page' : 'Failed to create page');
      console.error('Error saving page:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRouteChange = (value: string) => {
    // Auto-format route
    let route = value;
    if (route && !route.startsWith('/')) {
      route = '/' + route;
    }
    // Remove spaces and convert to lowercase
    route = route.toLowerCase().replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, route }));
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    
    // Auto-generate route from name if creating new page and route is empty
    if (!isEditing && !formData.route) {
      const autoRoute = '/' + value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, route: autoRoute }));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Page Type Selection */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Page Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAGE_TYPES.map((pageType) => {
                  const Icon = getPageTypeIcon(pageType.id);
                  const isSelected = formData.pageType === pageType.id;
                  
                  return (
                    <button
                      key={pageType.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pageType: pageType.id }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="size-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {pageType.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {pageType.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Page Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter page name"
              required
            />
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Route *
            </label>
            <Input
              type="text"
              value={formData.route}
              onChange={(e) => handleRouteChange(e.target.value)}
              placeholder="/page-route"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The URL path where this page will be accessible
            </p>
          </div>

          {/* SEO Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              SEO Settings
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Page title for search engines"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description for search engines"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || isCreating}
            >
              {saving || isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {isEditing ? 'Save Changes' : 'Create Page'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}