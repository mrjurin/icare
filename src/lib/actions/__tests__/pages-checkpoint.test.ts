/**
 * Checkpoint test for Dynamic Page Builder core backend functionality
 * This test verifies that all server actions work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db';
import { pageLayouts, contentBlocks, blockTranslations, pageVersions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getAllPages,
  createPage,
  updatePageLayout,
  publishPage,
  getContentBlocks,
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
  updateBlockTranslation,
  createPageVersion,
  getPageVersions,
  restorePageVersion,
} from '../pages';

// Mock the access control module
vi.mock('@/lib/utils/access-control', () => ({
  getCurrentUserAccess: vi.fn().mockResolvedValue({
    isAuthenticated: true,
    isSuperAdmin: true,
    isAdun: true,
    staffId: 1,
  }),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Dynamic Page Builder - Core Backend Checkpoint', () => {
  let testLayoutId: number;

  beforeEach(async () => {
    // Clean up any existing test data
    await db.delete(pageVersions);
    await db.delete(blockTranslations);
    await db.delete(contentBlocks);
    await db.delete(pageLayouts);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(pageVersions);
    await db.delete(blockTranslations);
    await db.delete(contentBlocks);
    await db.delete(pageLayouts);
  });

  describe('Page Management Operations', () => {
    it('should create, read, update, and publish pages', async () => {
      // Test page creation
      const createResult = await createPage({
        name: 'Test Landing Page',
        pageType: 'landing',
        route: '/test-landing',
        title: 'Test Landing Page Title',
        description: 'Test description',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      testLayoutId = createResult.data!.id;
      // Test page retrieval
      const getAllResult = await getAllPages();
      expect(getAllResult.success).toBe(true);
      expect(getAllResult.data).toHaveLength(1);
      expect(getAllResult.data![0].name).toBe('Test Landing Page');

      // Test page update
      const updateResult = await updatePageLayout({
        id: testLayoutId,
        name: 'Updated Landing Page',
        title: 'Updated Title',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data!.name).toBe('Updated Landing Page');
      expect(updateResult.data!.title).toBe('Updated Title');

      // Test page publishing
      const publishResult = await publishPage(testLayoutId);
      expect(publishResult.success).toBe(true);
    });
  });

  describe('Content Block Operations', () => {
    beforeEach(async () => {
      // Create a test page for content blocks
      const createResult = await createPage({
        name: 'Test Page for Blocks',
        pageType: 'landing',
        route: '/test-blocks',
      });
      testLayoutId = createResult.data!.id;
    });

    it('should create, read, update, and delete content blocks', async () => {
      // Test content block creation
      const createBlockResult = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'hero',
        blockKey: 'hero-section',
        displayOrder: 1,
        configuration: { title: 'Hero Title' },
        translations: {
          en: { title: 'Hero Title', subtitle: 'Hero Subtitle' },
          ms: { title: 'Tajuk Hero', subtitle: 'Subtajuk Hero' },
        },
      });

      expect(createBlockResult.success).toBe(true);
      expect(createBlockResult.data).toBeDefined();
      const blockId = createBlockResult.data!.id;

      // Test content block retrieval
      const getBlocksResult = await getContentBlocks(testLayoutId);
      expect(getBlocksResult.success).toBe(true);
      expect(getBlocksResult.data).toHaveLength(1);
      expect(getBlocksResult.data![0].blockType).toBe('hero');
      expect(getBlocksResult.data![0].translations).toHaveLength(2);

      // Test content block update
      const updateBlockResult = await updateContentBlock({
        id: blockId,
        blockType: 'hero',
        configuration: { title: 'Updated Hero Title' },
        translations: {
          en: { title: 'Updated Hero Title', subtitle: 'Updated Subtitle' },
        },
      });

      expect(updateBlockResult.success).toBe(true);
      expect(updateBlockResult.data!.translations).toHaveLength(1);

      // Test content block deletion
      const deleteBlockResult = await deleteContentBlock(blockId);
      expect(deleteBlockResult.success).toBe(true);

      // Verify block is deleted
      const finalGetBlocksResult = await getContentBlocks(testLayoutId);
      expect(finalGetBlocksResult.success).toBe(true);
      expect(finalGetBlocksResult.data).toHaveLength(0);
    });
  });

  describe('Translation Management', () => {
    let blockId: number;

    beforeEach(async () => {
      // Create test page and block
      const createPageResult = await createPage({
        name: 'Test Translation Page',
        pageType: 'about',
        route: '/test-translations',
      });
      testLayoutId = createPageResult.data!.id;

      const createBlockResult = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'text',
        blockKey: 'text-block',
        displayOrder: 1,
      });
      blockId = createBlockResult.data!.id;
    });

    it('should manage block translations correctly', async () => {
      // Test translation creation
      const createTranslationResult = await updateBlockTranslation(
        blockId,
        'en',
        { title: 'English Title', content: 'English content' }
      );

      expect(createTranslationResult.success).toBe(true);
      expect(createTranslationResult.data!.locale).toBe('en');

      // Test translation update
      const updateTranslationResult = await updateBlockTranslation(
        blockId,
        'en',
        { title: 'Updated English Title', content: 'Updated English content' }
      );

      expect(updateTranslationResult.success).toBe(true);

      // Test multiple locale translations
      const createMalayResult = await updateBlockTranslation(
        blockId,
        'ms',
        { title: 'Tajuk Melayu', content: 'Kandungan Melayu' }
      );

      expect(createMalayResult.success).toBe(true);

      // Verify translations are stored correctly
      const getBlocksResult = await getContentBlocks(testLayoutId);
      expect(getBlocksResult.success).toBe(true);
      expect(getBlocksResult.data![0].translations).toHaveLength(2);
    });
  });

  describe('Version Management', () => {
    let blockId: number;

    beforeEach(async () => {
      // Create test page with content
      const createPageResult = await createPage({
        name: 'Test Version Page',
        pageType: 'landing',
        route: '/test-versions',
      });
      testLayoutId = createPageResult.data!.id;

      const createBlockResult = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'hero',
        blockKey: 'hero-version',
        displayOrder: 1,
        translations: {
          en: { title: 'Original Title' },
        },
      });
      blockId = createBlockResult.data!.id;
    });

    it('should create and manage page versions', async () => {
      // Test version creation
      const createVersionResult = await createPageVersion({
        layoutId: testLayoutId,
        isPublished: false,
      });

      expect(createVersionResult.success).toBe(true);
      expect(createVersionResult.data!.versionNumber).toBe(1);

      // Test version retrieval
      const getVersionsResult = await getPageVersions(testLayoutId);
      expect(getVersionsResult.success).toBe(true);
      expect(getVersionsResult.data).toHaveLength(1);

      // Make changes to the page
      await updateContentBlock({
        id: blockId,
        translations: {
          en: { title: 'Modified Title' },
        },
      });

      // Create another version
      const createVersion2Result = await createPageVersion({
        layoutId: testLayoutId,
        isPublished: false,
      });

      expect(createVersion2Result.success).toBe(true);
      expect(createVersion2Result.data!.versionNumber).toBe(2);

      // Test version restoration
      const restoreResult = await restorePageVersion(createVersionResult.data!.id);
      expect(restoreResult.success).toBe(true);

      // Verify content was restored
      const getBlocksResult = await getContentBlocks(testLayoutId);
      expect(getBlocksResult.success).toBe(true);
      const restoredTranslation = getBlocksResult.data![0].translations.find(t => t.locale === 'en');
      expect(JSON.parse(restoredTranslation!.content!).title).toBe('Original Title');
    });
  });

  describe('Database Constraints and Integrity', () => {
    it('should enforce unique route constraint', async () => {
      // Create first page
      const createResult1 = await createPage({
        name: 'First Page',
        pageType: 'landing',
        route: '/unique-route',
      });
      expect(createResult1.success).toBe(true);

      // Try to create second page with same route
      const createResult2 = await createPage({
        name: 'Second Page',
        pageType: 'about',
        route: '/unique-route',
      });
      expect(createResult2.success).toBe(false);
      expect(createResult2.error).toContain('route already exists');
    });

    it('should enforce unique block key within layout', async () => {
      // Create test page
      const createPageResult = await createPage({
        name: 'Test Unique Keys',
        pageType: 'landing',
        route: '/test-unique-keys',
      });
      testLayoutId = createPageResult.data!.id;

      // Create first block
      const createBlock1Result = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'hero',
        blockKey: 'unique-key',
        displayOrder: 1,
      });
      expect(createBlock1Result.success).toBe(true);

      // Try to create second block with same key
      const createBlock2Result = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'text',
        blockKey: 'unique-key',
        displayOrder: 2,
      });
      expect(createBlock2Result.success).toBe(false);
      expect(createBlock2Result.error).toContain('key already exists');
    });

    it('should cascade delete content blocks when page is deleted', async () => {
      // Create test page with content blocks
      const createPageResult = await createPage({
        name: 'Test Cascade Delete',
        pageType: 'landing',
        route: '/test-cascade',
      });
      testLayoutId = createPageResult.data!.id;

      const createBlockResult = await createContentBlock({
        layoutId: testLayoutId,
        blockType: 'hero',
        blockKey: 'cascade-test',
        displayOrder: 1,
        translations: {
          en: { title: 'Test Title' },
        },
      });
      expect(createBlockResult.success).toBe(true);

      // Delete the page directly from database
      await db.delete(pageLayouts).where(eq(pageLayouts.id, testLayoutId));

      // Verify content blocks and translations were cascade deleted
      const remainingBlocks = await db.select().from(contentBlocks).where(eq(contentBlocks.layoutId, testLayoutId));
      expect(remainingBlocks).toHaveLength(0);

      const remainingTranslations = await db.select().from(blockTranslations);
      expect(remainingTranslations).toHaveLength(0);
    });
  });
});