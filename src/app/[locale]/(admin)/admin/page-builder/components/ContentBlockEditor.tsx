"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Languages, Settings, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { updateContentBlock, updateBlockTranslation } from "@/lib/actions/pages";
import { getBlockType, BlockValidator } from "@/lib/types/page-builder";
import { TemplateManager } from "@/lib/templates/block-templates";
import FormField from "./FormField";

interface ContentBlockEditorProps {
  block: ContentBlockWithTranslations;
  onClose: () => void;
  onSave: (updatedBlock: ContentBlockWithTranslations) => void;
  currentLocale: string;
}

export default function ContentBlockEditor({
  block,
  onClose,
  onSave,
  currentLocale
}: ContentBlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [activeLocale, setActiveLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Content state for each locale
  const [contentByLocale, setContentByLocale] = useState<Record<string, Record<string, any>>>({});
  
  // Configuration state
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  
  // Block settings
  const [blockSettings, setBlockSettings] = useState({
    isVisible: block.isVisible,
    displayOrder: block.displayOrder
  });

  const blockType = getBlockType(block.blockType);
  const availableLocales = ['en', 'ms'];

  useEffect(() => {
    // Initialize content for each locale
    const initialContent: Record<string, Record<string, any>> = {};
    
    availableLocales.forEach(locale => {
      const translation = block.translations.find(t => t.locale === locale);
      if (translation?.content) {
        try {
          initialContent[locale] = JSON.parse(translation.content);
        } catch (e) {
          console.warn(`Failed to parse content for locale ${locale}:`, e);
          initialContent[locale] = {};
        }
      } else {
        initialContent[locale] = {};
      }
    });
    
    setContentByLocale(initialContent);

    // Initialize configuration
    if (block.configuration) {
      try {
        setConfiguration(JSON.parse(block.configuration));
      } catch (e) {
        console.warn('Failed to parse block configuration:', e);
        setConfiguration(blockType?.defaultConfig || {});
      }
    } else {
      setConfiguration(blockType?.defaultConfig || {});
    }
  }, [block, blockType]);

  const handleContentChange = (fieldKey: string, value: any) => {
    setContentByLocale(prev => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        [fieldKey]: value
      }
    }));
  };

  const handleConfigurationChange = (fieldKey: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleSave = async () => {
    if (!blockType) {
      setError('Unknown block type');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Validate content for current locale
      const currentContent = contentByLocale[activeLocale] || {};
      const validation = BlockValidator.validateBlock(block.blockType, configuration, currentContent);
      
      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Update block configuration and settings
      const updateResult = await updateContentBlock({
        id: block.id,
        configuration,
        isVisible: blockSettings.isVisible,
        displayOrder: blockSettings.displayOrder
      });

      if (!updateResult.success) {
        setError(updateResult.error || 'Failed to update block');
        return;
      }

      // Update translations for all locales that have content
      for (const [locale, content] of Object.entries(contentByLocale)) {
        if (Object.keys(content).length > 0) {
          const translationResult = await updateBlockTranslation(block.id, locale, content);
          if (!translationResult.success) {
            console.warn(`Failed to update translation for locale ${locale}:`, translationResult.error);
          }
        }
      }

      // Create updated block object
      const updatedBlock: ContentBlockWithTranslations = {
        ...block,
        configuration: JSON.stringify(configuration),
        isVisible: blockSettings.isVisible,
        displayOrder: blockSettings.displayOrder,
        translations: block.translations.map(translation => {
          const updatedContent = contentByLocale[translation.locale];
          if (updatedContent && Object.keys(updatedContent).length > 0) {
            return {
              ...translation,
              content: JSON.stringify(updatedContent)
            };
          }
          return translation;
        })
      };

      onSave(updatedBlock);
    } catch (err) {
      setError('Failed to save block');
      console.error('Error saving block:', err);
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const templateData = TemplateManager.applyTemplate(templateId);
    if (templateData) {
      setConfiguration(templateData.configuration);
      setContentByLocale(prev => ({
        ...prev,
        [activeLocale]: templateData.content
      }));
    }
  };

  const currentContent = contentByLocale[activeLocale] || {};
  const availableTemplates = TemplateManager.getTemplatesForBlockType(block.blockType);

  if (!blockType) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Unknown block type: {block.blockType}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <blockType.icon className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Edit {blockType.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {block.blockKey}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Settings className="size-4 mr-2" />
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'content' ? (
            <div className="p-6 space-y-6">
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Languages className="size-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Language:
                  </span>
                  <select
                    value={activeLocale}
                    onChange={(e) => setActiveLocale(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="en">English</option>
                    <option value="ms">Bahasa Malaysia</option>
                  </select>
                </div>

                {/* Template Selector */}
                {availableTemplates.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Template:
                    </span>
                    <select
                      onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Choose template...</option>
                      {availableTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Content Fields */}
              <div className="space-y-6">
                {blockType.editableFields.map(field => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={currentContent[field.key]}
                    onChange={(value) => handleContentChange(field.key, value)}
                    disabled={saving}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Block Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Block Settings
                </h3>

                {/* Visibility */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Visibility
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Control whether this block is visible on the public page
                    </p>
                  </div>
                  <button
                    onClick={() => setBlockSettings(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      blockSettings.isVisible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {blockSettings.isVisible ? (
                      <>
                        <Eye className="size-4" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-4" />
                        Hidden
                      </>
                    )}
                  </button>
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={blockSettings.displayOrder}
                    onChange={(e) => setBlockSettings(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lower numbers appear first on the page
                  </p>
                </div>
              </div>

              {/* Configuration Fields */}
              {Object.keys(blockType.defaultConfig).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(blockType.defaultConfig).map(([key, defaultValue]) => {
                      // Create a synthetic field for configuration
                      const configField = {
                        key,
                        type: typeof defaultValue === 'boolean' ? 'boolean' as const : 
                              typeof defaultValue === 'number' ? 'number' as const : 'text' as const,
                        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                        required: false
                      };

                      return (
                        <FormField
                          key={key}
                          field={configField}
                          value={configuration[key] ?? defaultValue}
                          onChange={(value) => handleConfigurationChange(key, value)}
                          disabled={saving}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}