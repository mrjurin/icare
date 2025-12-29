"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit3, Eye, EyeOff, Copy, Trash2, Settings } from "lucide-react";
import { type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { getBlockType } from "@/lib/types/page-builder";

interface DraggableBlockProps {
  block: ContentBlockWithTranslations;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  locale: string;
}

export default function DraggableBlock({
  block,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  locale
}: DraggableBlockProps) {
  const [showActions, setShowActions] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockType = getBlockType(block.blockType);
  const Icon = blockType?.icon;

  // Get localized content
  const localizedTranslation = block.translations.find(t => t.locale === locale) || 
                              block.translations.find(t => t.locale === 'en') ||
                              block.translations[0];
  
  let localizedContent: any = {};
  if (localizedTranslation?.content) {
    try {
      localizedContent = JSON.parse(localizedTranslation.content);
    } catch (e) {
      console.warn('Failed to parse block content:', e);
    }
  }

  // Get block title for display
  const getBlockTitle = () => {
    if (localizedContent.title) return localizedContent.title;
    if (blockType?.name) return blockType.name;
    return block.blockKey;
  };

  // Get block preview content
  const getBlockPreview = () => {
    if (localizedContent.subtitle) return localizedContent.subtitle;
    if (localizedContent.description) return localizedContent.description;
    if (localizedContent.content) {
      // Strip HTML tags for preview
      const textContent = localizedContent.content.replace(/<[^>]*>/g, '');
      return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    }
    return blockType?.description || 'No content';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border transition-all ${
        isDragging
          ? 'border-primary shadow-lg bg-white dark:bg-gray-900 opacity-50'
          : isSelected
          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
          : block.isVisible
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-75'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1 rounded cursor-grab active:cursor-grabbing transition-opacity ${
          showActions || isDragging ? 'opacity-100' : 'opacity-0'
        } hover:bg-gray-100 dark:hover:bg-gray-800`}
      >
        <GripVertical className="size-4 text-gray-400" />
      </div>

      {/* Block Content */}
      <div
        onClick={onSelect}
        className="pl-10 pr-12 py-4 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={`p-2 rounded-md flex-shrink-0 ${
              isSelected 
                ? 'bg-primary/10 text-primary' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              <Icon className="size-4" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {getBlockTitle()}
              </h4>
              <div className="flex items-center gap-1">
                {!block.isVisible && (
                  <div title="Hidden">
                    <EyeOff className="size-3 text-gray-400" />
                  </div>
                )}
                {blockType?.isSystemBlock && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    System
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {getBlockPreview()}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {blockType?.name || block.blockType}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Order: {block.displayOrder}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${
        showActions || isSelected ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title="Edit Block"
        >
          <Edit3 className="size-3" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title={block.isVisible ? "Hide Block" : "Show Block"}
        >
          {block.isVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title="Duplicate Block"
        >
          <Copy className="size-3" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Delete Block"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
      )}
    </div>
  );
}