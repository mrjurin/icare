/**
 * Page Builder Utilities
 * 
 * This file provides utility functions that integrate the block type system
 * with the existing page management actions and database operations.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { 
  BLOCK_TYPES, 
  PAGE_TYPES, 
  BlockValidator, 
  getBlockType, 
  getPageType,
  createDefaultBlockContent,
  generateBlockKey,
  type ContentBlockType,
  type PageType
} from '../types/page-builder';

import { 
  TemplateManager, 
  TemplateValidator,
  type BlockTemplate 
} from '../templates/block-templates';

import {
  createContentBlock,
  updateContentBlock,
  getContentBlocks,
  type CreateContentBlockInput,
  type UpdateContentBlockInput,
  type ContentBlockWithTranslations
} from '../actions/pages';

// Enhanced content block creation with template support
// Requirements: 6.2 - Add template selection and customization logic

export interface CreateBlockWithTemplateInput {
  layoutId: number;
  blockType: string;
  templateId?: string;
  customizations?: {
    configuration?: Record<string, any>;
    content?: Record<string, any>;
    styling?: Record<string, any>;
  };
  position?: number;
  locale?: string;
}

/**
 * Create a content block using a template
 */
export async function createContentBlockWithTemplate(
  input: CreateBlockWithTemplateInput
): Promise<{
  success: boolean;
  error?: string;
  data?: ContentBlockWithTranslations;
}> {
  try {
    // Validate block type
    const blockType = getBlockType(input.blockType);
    if (!blockType) {
      return { success: false, error: `Unknown block type: ${input.blockType}` };
    }

    // Get existing blocks to generate unique key
    const existingBlocksResult = await getContentBlocks(input.layoutId);
    if (!existingBlocksResult.success) {
      return { success: false, error: 'Failed to fetch existing blocks' };
    }

    const existingKeys = existingBlocksResult.data?.map(b => b.blockKey) || [];
    const blockKey = generateBlockKey(input.blockType, existingKeys);

    // Prepare block content and configuration
    let configuration = blockType.defaultConfig;
    let content = createDefaultBlockContent(input.blockType);

    // Apply template if specified
    if (input.templateId) {
      const templateData = input.customizations 
        ? TemplateManager.customizeTemplate(input.templateId, input.customizations)
        : TemplateManager.applyTemplate(input.templateId);

      if (!templateData) {
        return { success: false, error: `Template not found: ${input.templateId}` };
      }

      configuration = templateData.configuration;
      content = templateData.content;
    } else if (input.customizations) {
      // Apply customizations without template
      if (input.customizations.configuration) {
        configuration = { ...configuration, ...input.customizations.configuration };
      }
      if (input.customizations.content) {
        content = { ...content, ...input.customizations.content };
      }
    }

    // Validate the block configuration and content
    const validation = BlockValidator.validateBlock(input.blockType, configuration, content);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: `Block validation failed: ${validation.errors.join(', ')}` 
      };
    }

    // Prepare translations
    const translations: Record<string, Record<string, any>> = {};
    const locale = input.locale || 'en';
    translations[locale] = content;

    // Create the content block
    const createInput: CreateContentBlockInput = {
      layoutId: input.layoutId,
      blockType: input.blockType,
      blockKey,
      displayOrder: input.position,
      isVisible: true,
      configuration,
      translations
    };

    const result = await createContentBlock(createInput);
    return result;

  } catch (error) {
    console.error('Error creating content block with template:', error);
    return { success: false, error: 'Failed to create content block' };
  }
}

/**
 * Update a content block with template customizations
 */
export async function updateContentBlockWithTemplate(
  blockId: number,
  templateId?: string,
  customizations?: {
    configuration?: Record<string, any>;
    content?: Record<string, any>;
    styling?: Record<string, any>;
  },
  locale: string = 'en'
): Promise<{
  success: boolean;
  error?: string;
  data?: ContentBlockWithTranslations;
}> {
  try {
    let updates: Partial<UpdateContentBlockInput> = {};

    if (templateId) {
      // Apply template with customizations
      const templateData = customizations 
        ? TemplateManager.customizeTemplate(templateId, customizations)
        : TemplateManager.applyTemplate(templateId);

      if (!templateData) {
        return { success: false, error: `Template not found: ${templateId}` };
      }

      updates.configuration = templateData.configuration;
      
      // Update translations with template content
      const translations: Record<string, Record<string, any>> = {};
      translations[locale] = templateData.content;
      updates.translations = translations;

    } else if (customizations) {
      // Apply only customizations
      if (customizations.configuration) {
        updates.configuration = customizations.configuration;
      }
      
      if (customizations.content) {
        const translations: Record<string, Record<string, any>> = {};
        translations[locale] = customizations.content;
        updates.translations = translations;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    const updateInput: UpdateContentBlockInput = {
      id: blockId,
      ...updates
    };

    const result = await updateContentBlock(updateInput);
    return result;

  } catch (error) {
    console.error('Error updating content block with template:', error);
    return { success: false, error: 'Failed to update content block' };
  }
}

/**
 * Get available block types for a specific page type
 */
export function getAvailableBlockTypesForPage(pageTypeId: string): ContentBlockType[] {
  return BlockValidator.getAllowedBlockTypes(pageTypeId);
}

/**
 * Get available templates for a block type
 */
export function getAvailableTemplatesForBlock(blockTypeId: string): BlockTemplate[] {
  return TemplateManager.getTemplatesForBlockType(blockTypeId);
}

/**
 * Validate if a block can be added to a page
 */
export async function validateBlockAddition(
  layoutId: number,
  blockTypeId: string,
  pageTypeId?: string
): Promise<{
  canAdd: boolean;
  reason?: string;
  warnings?: string[];
}> {
  try {
    // Get existing blocks to check instance limits
    const existingBlocksResult = await getContentBlocks(layoutId);
    if (!existingBlocksResult.success) {
      return { canAdd: false, reason: 'Failed to fetch existing blocks' };
    }

    const existingBlocks = existingBlocksResult.data || [];
    const currentBlockCount = existingBlocks.filter(b => b.blockType === blockTypeId).length;

    // Check instance limits
    const instanceCheck = BlockValidator.canAddMoreBlocks(blockTypeId, currentBlockCount);
    if (!instanceCheck.canAdd) {
      return { canAdd: false, reason: instanceCheck.reason };
    }

    // Check page type compatibility if provided
    if (pageTypeId) {
      const isAllowed = BlockValidator.isBlockAllowedOnPage(blockTypeId, pageTypeId);
      if (!isAllowed) {
        return { 
          canAdd: false, 
          reason: `Block type '${blockTypeId}' is not allowed on page type '${pageTypeId}'` 
        };
      }
    }

    const warnings: string[] = [];

    // Check for potential conflicts or recommendations
    const blockType = getBlockType(blockTypeId);
    if (blockType?.isSystemBlock) {
      warnings.push('This is a system block that connects to dynamic data');
    }

    if (blockType?.maxInstances === 1 && currentBlockCount === 0) {
      warnings.push('Only one instance of this block type is allowed per page');
    }

    return { canAdd: true, warnings };

  } catch (error) {
    console.error('Error validating block addition:', error);
    return { canAdd: false, reason: 'Validation failed' };
  }
}

/**
 * Get page builder configuration for a specific page
 */
export async function getPageBuilderConfig(
  layoutId: number,
  pageTypeId?: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    availableBlockTypes: ContentBlockType[];
    existingBlocks: ContentBlockWithTranslations[];
    pageType?: PageType;
    blockLimits: Record<string, { current: number; max?: number }>;
  };
}> {
  try {
    // Get existing blocks
    const existingBlocksResult = await getContentBlocks(layoutId);
    if (!existingBlocksResult.success) {
      return { success: false, error: 'Failed to fetch existing blocks' };
    }

    const existingBlocks = existingBlocksResult.data || [];

    // Get page type info
    let pageType: PageType | undefined;
    let availableBlockTypes: ContentBlockType[] = BLOCK_TYPES;

    if (pageTypeId) {
      pageType = getPageType(pageTypeId);
      if (pageType) {
        availableBlockTypes = getAvailableBlockTypesForPage(pageTypeId);
      }
    }

    // Calculate block limits
    const blockLimits: Record<string, { current: number; max?: number }> = {};
    
    for (const blockType of availableBlockTypes) {
      const currentCount = existingBlocks.filter(b => b.blockType === blockType.id).length;
      blockLimits[blockType.id] = {
        current: currentCount,
        max: blockType.maxInstances
      };
    }

    return {
      success: true,
      data: {
        availableBlockTypes,
        existingBlocks,
        pageType,
        blockLimits
      }
    };

  } catch (error) {
    console.error('Error getting page builder config:', error);
    return { success: false, error: 'Failed to get page builder configuration' };
  }
}

/**
 * Initialize a new page with default blocks based on page type
 */
export async function initializePageWithDefaults(
  layoutId: number,
  pageTypeId: string,
  locale: string = 'en'
): Promise<{
  success: boolean;
  error?: string;
  data?: ContentBlockWithTranslations[];
}> {
  try {
    const pageType = getPageType(pageTypeId);
    if (!pageType) {
      return { success: false, error: `Unknown page type: ${pageTypeId}` };
    }

    const createdBlocks: ContentBlockWithTranslations[] = [];

    // Create default blocks for the page type
    for (const defaultBlock of pageType.defaultBlocks) {
      const createInput: CreateBlockWithTemplateInput = {
        layoutId,
        blockType: defaultBlock.type,
        position: defaultBlock.order,
        locale,
        customizations: {
          content: defaultBlock.defaultContent,
          configuration: defaultBlock.configuration
        }
      };

      const result = await createContentBlockWithTemplate(createInput);
      if (result.success && result.data) {
        createdBlocks.push(result.data);
      } else {
        console.warn(`Failed to create default block ${defaultBlock.type}:`, result.error);
      }
    }

    return { success: true, data: createdBlocks };

  } catch (error) {
    console.error('Error initializing page with defaults:', error);
    return { success: false, error: 'Failed to initialize page with default blocks' };
  }
}

/**
 * Duplicate a content block with all its translations
 */
export async function duplicateContentBlock(
  sourceBlockId: number,
  targetLayoutId: number,
  position?: number
): Promise<{
  success: boolean;
  error?: string;
  data?: ContentBlockWithTranslations;
}> {
  try {
    // This would need to be implemented in the pages actions
    // For now, return a placeholder
    return { success: false, error: 'Block duplication not yet implemented' };

  } catch (error) {
    console.error('Error duplicating content block:', error);
    return { success: false, error: 'Failed to duplicate content block' };
  }
}

/**
 * Get block type statistics for analytics
 */
export async function getBlockTypeUsageStats(
  layoutId?: number
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    totalBlocks: number;
    blocksByType: Record<string, number>;
    blocksByCategory: Record<string, number>;
    mostUsedBlocks: Array<{ blockType: string; count: number; name: string }>;
  };
}> {
  try {
    let allBlocks: ContentBlockWithTranslations[] = [];

    if (layoutId) {
      // Get blocks for specific layout
      const result = await getContentBlocks(layoutId);
      if (!result.success) {
        return { success: false, error: 'Failed to fetch blocks' };
      }
      allBlocks = result.data || [];
    } else {
      // This would need to be implemented to get all blocks across all layouts
      return { success: false, error: 'Global block statistics not yet implemented' };
    }

    const stats = {
      totalBlocks: allBlocks.length,
      blocksByType: {} as Record<string, number>,
      blocksByCategory: {} as Record<string, number>,
      mostUsedBlocks: [] as Array<{ blockType: string; count: number; name: string }>
    };

    // Count blocks by type and category
    allBlocks.forEach(block => {
      // Count by type
      stats.blocksByType[block.blockType] = (stats.blocksByType[block.blockType] || 0) + 1;

      // Count by category
      const blockType = getBlockType(block.blockType);
      if (blockType) {
        stats.blocksByCategory[blockType.category] = 
          (stats.blocksByCategory[blockType.category] || 0) + 1;
      }
    });

    // Create most used blocks list
    stats.mostUsedBlocks = Object.entries(stats.blocksByType)
      .map(([blockType, count]) => {
        const blockTypeDef = getBlockType(blockType);
        return {
          blockType,
          count,
          name: blockTypeDef?.name || blockType
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most used

    return { success: true, data: stats };

  } catch (error) {
    console.error('Error getting block type usage stats:', error);
    return { success: false, error: 'Failed to get usage statistics' };
  }
}

/**
 * Validate page structure and provide recommendations
 */
export async function validatePageStructure(
  layoutId: number,
  pageTypeId?: string
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
}> {
  try {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };

    // Get page configuration
    const configResult = await getPageBuilderConfig(layoutId, pageTypeId);
    if (!configResult.success) {
      return { success: false, error: configResult.error };
    }

    const { existingBlocks, pageType, blockLimits } = configResult.data!;

    // Check for required blocks based on page type
    if (pageType) {
      const requiredBlocks = pageType.defaultBlocks.filter(db => {
        const blockType = getBlockType(db.type);
        return blockType?.isSystemBlock || blockType?.maxInstances === 1;
      });

      for (const requiredBlock of requiredBlocks) {
        const hasBlock = existingBlocks.some(b => b.blockType === requiredBlock.type);
        if (!hasBlock) {
          result.warnings.push(`Consider adding a ${requiredBlock.type} block for better page structure`);
        }
      }
    }

    // Check block limits
    for (const [blockType, limits] of Object.entries(blockLimits)) {
      if (limits.max && limits.current > limits.max) {
        result.errors.push(`Too many ${blockType} blocks (${limits.current}/${limits.max})`);
        result.isValid = false;
      }
    }

    // Check for common page structure issues
    if (existingBlocks.length === 0) {
      result.warnings.push('Page has no content blocks');
    }

    const hasHero = existingBlocks.some(b => b.blockType === 'hero');
    const hasCTA = existingBlocks.some(b => b.blockType === 'cta');

    if (pageTypeId === 'landing' && !hasHero) {
      result.recommendations.push('Landing pages typically benefit from a hero section');
    }

    if (pageTypeId === 'landing' && !hasCTA) {
      result.recommendations.push('Consider adding a call-to-action to improve conversions');
    }

    // Check block order and structure
    const blockOrder = existingBlocks
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(b => b.blockType);

    if (blockOrder.length > 0 && blockOrder[0] !== 'hero' && hasHero) {
      result.recommendations.push('Hero sections are typically placed at the top of the page');
    }

    return { success: true, data: result };

  } catch (error) {
    console.error('Error validating page structure:', error);
    return { success: false, error: 'Failed to validate page structure' };
  }
}

// Export utility functions for easy access
export {
  BLOCK_TYPES,
  PAGE_TYPES,
  BlockValidator,
  TemplateManager,
  TemplateValidator,
  getBlockType,
  getPageType,
  createDefaultBlockContent,
  generateBlockKey
};