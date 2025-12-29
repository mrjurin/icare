"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import { type ContentBlockWithTranslations } from "@/lib/actions/pages";
import { 
  updateContentBlock, 
  deleteContentBlock,
  reorderContentBlocks
} from "@/lib/actions/pages";
import { createContentBlockWithTemplate } from "@/lib/utils/page-builder";
import DraggableBlock from "./DraggableBlock";
import BlockPalette from "./BlockPalette";
import ContentBlockEditor from "./ContentBlockEditor";

interface DragDropEditorProps {
  pageId: number;
  pageTypeId: string;
  blocks: ContentBlockWithTranslations[];
  selectedBlockId: number | null;
  onBlocksChange: (blocks: ContentBlockWithTranslations[]) => void;
  onSelectBlock: (blockId: number | null) => void;
  locale: string;
}

export default function DragDropEditor({
  pageId,
  pageTypeId,
  blocks,
  selectedBlockId,
  onBlocksChange,
  onSelectBlock,
  locale
}: DragDropEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = blocks.findIndex(block => block.id.toString() === active.id);
    const newIndex = blocks.findIndex(block => block.id.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update the UI
    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      displayOrder: index + 1
    }));
    
    onBlocksChange(reorderedBlocks);

    // Update the server
    try {
      const reorderData = reorderedBlocks.map(block => ({
        id: block.id,
        displayOrder: block.displayOrder
      }));

      const result = await reorderContentBlocks(pageId, reorderData);
      if (!result.success) {
        // Revert on error
        onBlocksChange(blocks);
        setError(result.error || 'Failed to reorder blocks');
      }
    } catch (err) {
      // Revert on error
      onBlocksChange(blocks);
      setError('Failed to reorder blocks');
      console.error('Error reordering blocks:', err);
    }
  }, [blocks, pageId, onBlocksChange]);

  const handleAddBlock = useCallback(async (blockType: string) => {
    try {
      setIsAddingBlock(true);
      setError(null);

      // Get next display order
      const maxOrder = Math.max(0, ...blocks.map(b => b.displayOrder));
      const displayOrder = maxOrder + 1;

      const result = await createContentBlockWithTemplate({
        layoutId: pageId,
        blockType,
        position: displayOrder,
        locale
      });

      if (result.success && result.data) {
        const newBlocks = [...blocks, result.data];
        onBlocksChange(newBlocks);
        onSelectBlock(result.data.id);
      } else {
        setError(result.error || 'Failed to add block');
      }
    } catch (err) {
      setError('Failed to add block');
      console.error('Error adding block:', err);
    } finally {
      setIsAddingBlock(false);
    }
  }, [blocks, pageId, locale, onBlocksChange, onSelectBlock]);

  const handleEditBlock = useCallback((blockId: number) => {
    setEditingBlockId(blockId);
  }, []);

  const handleDuplicateBlock = useCallback(async (blockId: number) => {
    const blockToDuplicate = blocks.find(b => b.id === blockId);
    if (!blockToDuplicate) return;

    try {
      setError(null);

      // Get next display order
      const maxOrder = Math.max(0, ...blocks.map(b => b.displayOrder));
      const displayOrder = maxOrder + 1;

      // Parse configuration
      let configuration = {};
      if (blockToDuplicate.configuration) {
        try {
          configuration = JSON.parse(blockToDuplicate.configuration);
        } catch (e) {
          console.warn('Failed to parse block configuration:', e);
        }
      }

      // Parse translations
      const translations: Record<string, Record<string, any>> = {};
      blockToDuplicate.translations.forEach(translation => {
        if (translation.content) {
          try {
            translations[translation.locale] = JSON.parse(translation.content);
          } catch (e) {
            console.warn('Failed to parse translation content:', e);
          }
        }
      });

      const result = await createContentBlockWithTemplate({
        layoutId: pageId,
        blockType: blockToDuplicate.blockType,
        position: displayOrder,
        locale,
        customizations: {
          configuration,
          content: translations[locale] || translations['en'] || {}
        }
      });

      if (result.success && result.data) {
        const newBlocks = [...blocks, result.data];
        onBlocksChange(newBlocks);
        onSelectBlock(result.data.id);
      } else {
        setError(result.error || 'Failed to duplicate block');
      }
    } catch (err) {
      setError('Failed to duplicate block');
      console.error('Error duplicating block:', err);
    }
  }, [blocks, pageId, locale, onBlocksChange, onSelectBlock]);

  const handleDeleteBlock = useCallback(async (blockId: number) => {
    if (!confirm('Are you sure you want to delete this block? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);

      const result = await deleteContentBlock(blockId);
      if (result.success) {
        const newBlocks = blocks.filter(b => b.id !== blockId);
        onBlocksChange(newBlocks);
        
        // Clear selection if deleted block was selected
        if (selectedBlockId === blockId) {
          onSelectBlock(null);
        }
      } else {
        setError(result.error || 'Failed to delete block');
      }
    } catch (err) {
      setError('Failed to delete block');
      console.error('Error deleting block:', err);
    }
  }, [blocks, selectedBlockId, onBlocksChange, onSelectBlock]);

  const handleToggleVisibility = useCallback(async (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      setError(null);

      const result = await updateContentBlock({
        id: blockId,
        isVisible: !block.isVisible
      });

      if (result.success && result.data) {
        const newBlocks = blocks.map(b => 
          b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
        );
        onBlocksChange(newBlocks);
      } else {
        setError(result.error || 'Failed to toggle block visibility');
      }
    } catch (err) {
      setError('Failed to toggle block visibility');
      console.error('Error toggling block visibility:', err);
    }
  }, [blocks, onBlocksChange]);

  // Sort blocks by display order
  const sortedBlocks = [...blocks].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex h-full">
      {/* Block Palette */}
      <BlockPalette
        pageTypeId={pageTypeId}
        onAddBlock={handleAddBlock}
        existingBlocks={blocks}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isAddingBlock && (
          <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-600 dark:text-blue-400">Adding block...</p>
            </div>
          </div>
        )}

        {/* Blocks List */}
        <div className="flex-1 p-4">
          {sortedBlocks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus className="size-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No blocks yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start building your page by adding blocks from the palette on the left.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedBlocks.map(block => block.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedBlocks.map(block => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => onSelectBlock(block.id)}
                      onEdit={() => handleEditBlock(block.id)}
                      onDuplicate={() => handleDuplicateBlock(block.id)}
                      onDelete={() => handleDeleteBlock(block.id)}
                      onToggleVisibility={() => handleToggleVisibility(block.id)}
                      locale={locale}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="rounded-lg border border-primary bg-white dark:bg-gray-900 shadow-lg opacity-90">
                    <div className="p-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Moving block...
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Content Block Editor Modal */}
      {editingBlockId && (
        <ContentBlockEditor
          block={blocks.find(b => b.id === editingBlockId)!}
          onClose={() => setEditingBlockId(null)}
          onSave={(updatedBlock) => {
            const newBlocks = blocks.map(b => 
              b.id === editingBlockId ? updatedBlock : b
            );
            onBlocksChange(newBlocks);
            setEditingBlockId(null);
          }}
          currentLocale={locale}
        />
      )}
    </div>
  );
}