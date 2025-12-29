"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { BLOCK_TYPES, getBlockTypesByCategory, type ContentBlockType } from "@/lib/types/page-builder";
import { getAvailableBlockTypesForPage } from "@/lib/utils/page-builder";

interface BlockPaletteProps {
  pageTypeId: string;
  onAddBlock: (blockType: string) => void;
  existingBlocks: Array<{ blockType: string }>;
}

const categoryLabels = {
  layout: 'Layout',
  content: 'Content',
  media: 'Media',
  interactive: 'Interactive',
  specialized: 'Specialized'
};

const categoryDescriptions = {
  layout: 'Structure and visual hierarchy',
  content: 'Text and rich content',
  media: 'Images, videos, and visual content',
  interactive: 'Forms and dynamic content',
  specialized: 'Specific functionality blocks'
};

export default function BlockPalette({ pageTypeId, onAddBlock, existingBlocks }: BlockPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get available block types for this page type
  const availableBlockTypes = getAvailableBlockTypesForPage(pageTypeId);

  // Filter blocks based on search and category
  const filteredBlocks = availableBlockTypes.filter(blockType => {
    const matchesSearch = !searchQuery || 
      blockType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blockType.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || blockType.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group blocks by category
  const groupedBlocks = filteredBlocks.reduce((groups, blockType) => {
    const category = blockType.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(blockType);
    return groups;
  }, {} as Record<string, ContentBlockType[]>);

  // Get block usage count
  const getBlockUsageCount = (blockTypeId: string) => {
    return existingBlocks.filter(block => block.blockType === blockTypeId).length;
  };

  // Check if block can be added (respecting max instances)
  const canAddBlock = (blockType: ContentBlockType) => {
    if (!blockType.maxInstances) return true;
    const currentCount = getBlockUsageCount(blockType.id);
    return currentCount < blockType.maxInstances;
  };

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>;

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Add Blocks
        </h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedBlocks).map(([category, blocks]) => (
          <div key={category}>
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
              </p>
            </div>
            
            <div className="space-y-2">
              {blocks.map(blockType => {
                const Icon = blockType.icon;
                const usageCount = getBlockUsageCount(blockType.id);
                const canAdd = canAddBlock(blockType);
                
                return (
                  <div
                    key={blockType.id}
                    className={`group relative rounded-lg border transition-all ${
                      canAdd
                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm cursor-pointer'
                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <button
                      onClick={() => canAdd && onAddBlock(blockType.id)}
                      disabled={!canAdd}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${
                          canAdd 
                            ? 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10' 
                            : 'bg-gray-50 dark:bg-gray-900'
                        }`}>
                          <Icon className={`size-4 ${
                            canAdd 
                              ? 'text-gray-600 dark:text-gray-400 group-hover:text-primary' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {blockType.name}
                            </h5>
                            {blockType.maxInstances && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {usageCount}/{blockType.maxInstances}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {blockType.description}
                          </p>
                          {blockType.isSystemBlock && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              System
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {canAdd && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1 bg-primary text-white rounded-full">
                          <Plus className="size-3" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Search className="size-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? `No blocks found for "${searchQuery}"`
                : 'No blocks available for this page type'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}