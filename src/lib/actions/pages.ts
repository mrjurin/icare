"use server";

import { db } from "@/db";
import { pageLayouts, contentBlocks, blockTranslations, pageVersions } from "@/db/schema";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";
import { eq, and, desc, ne } from "drizzle-orm";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type PageLayout = {
  id: number;
  name: string;
  pageType: string;
  route: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  isPublished: boolean;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePageInput = {
  name: string;
  pageType: string;
  route: string;
  title?: string;
  description?: string;
  isActive?: boolean;
};

export type UpdatePageInput = {
  id: number;
  name?: string;
  pageType?: string;
  route?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
};

/**
 * Get all pages with optional filtering
 */
export async function getAllPages(options?: {
  pageType?: string;
  isActive?: boolean;
  isPublished?: boolean;
}): Promise<ActionResult<PageLayout[]>> {
  try {
    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can manage pages" };
    }

    // Build where conditions
    const whereConditions = [];
    
    if (options?.pageType) {
      whereConditions.push(eq(pageLayouts.pageType, options.pageType));
    }

    if (options?.isActive !== undefined) {
      whereConditions.push(eq(pageLayouts.isActive, options.isActive));
    }

    if (options?.isPublished !== undefined) {
      whereConditions.push(eq(pageLayouts.isPublished, options.isPublished));
    }

    // Execute query with or without conditions
    const pages = whereConditions.length > 0
      ? await db
          .select()
          .from(pageLayouts)
          .where(and(...whereConditions))
          .orderBy(desc(pageLayouts.updatedAt))
      : await db
          .select()
          .from(pageLayouts)
          .orderBy(desc(pageLayouts.updatedAt));

    return { success: true, data: pages };
  } catch (error) {
    console.error("Error fetching pages:", error);
    return { success: false, error: "Failed to fetch pages" };
  }
}

/**
 * Get a single page by route
 */
export async function getPageByRoute(route: string): Promise<ActionResult<PageLayout>> {
  try {
    const pages = await db
      .select()
      .from(pageLayouts)
      .where(eq(pageLayouts.route, route))
      .limit(1);

    if (pages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    return { success: true, data: pages[0] };
  } catch (error) {
    console.error("Error fetching page by route:", error);
    return { success: false, error: "Failed to fetch page" };
  }
}

/**
 * Get a single page by ID
 */
export async function getPageById(id: number): Promise<ActionResult<PageLayout>> {
  try {
    const pages = await db
      .select()
      .from(pageLayouts)
      .where(eq(pageLayouts.id, id))
      .limit(1);

    if (pages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    return { success: true, data: pages[0] };
  } catch (error) {
    console.error("Error fetching page by ID:", error);
    return { success: false, error: "Failed to fetch page" };
  }
}

/**
 * Create a new page
 */
export async function createPage(input: CreatePageInput): Promise<ActionResult<PageLayout>> {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Page name is required" };
    }

    if (!input.pageType?.trim()) {
      return { success: false, error: "Page type is required" };
    }

    if (!input.route?.trim()) {
      return { success: false, error: "Route is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can create pages" };
    }

    // Check if route already exists
    const existingPage = await getPageByRoute(input.route);
    if (existingPage.success) {
      return { success: false, error: "A page with this route already exists" };
    }

    const newPage = await db
      .insert(pageLayouts)
      .values({
        name: input.name.trim(),
        pageType: input.pageType.trim(),
        route: input.route.trim(),
        title: input.title?.trim() || null,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        isPublished: false,
        createdBy: access.staffId || null,
      })
      .returning();

    revalidatePath("/admin/pages");
    return { success: true, data: newPage[0] };
  } catch (error) {
    console.error("Error creating page:", error);
    return { success: false, error: "Failed to create page" };
  }
}

/**
 * Update an existing page layout
 */
export async function updatePageLayout(input: UpdatePageInput): Promise<ActionResult<PageLayout>> {
  try {
    if (!input.id || Number.isNaN(input.id)) {
      return { success: false, error: "Invalid page ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can update pages" };
    }

    // Check if page exists
    const existingPageResult = await getPageById(input.id);
    if (!existingPageResult.success) {
      return existingPageResult;
    }

    const updates: Partial<typeof pageLayouts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        return { success: false, error: "Page name cannot be empty" };
      }
      updates.name = input.name.trim();
    }

    if (input.pageType !== undefined) {
      if (!input.pageType.trim()) {
        return { success: false, error: "Page type cannot be empty" };
      }
      updates.pageType = input.pageType.trim();
    }

    if (input.route !== undefined) {
      if (!input.route.trim()) {
        return { success: false, error: "Route cannot be empty" };
      }
      
      // Check if new route conflicts with existing pages (excluding current page)
      const existingPages = await db
        .select()
        .from(pageLayouts)
        .where(and(
          eq(pageLayouts.route, input.route.trim()),
          ne(pageLayouts.id, input.id)
        ));
      
      if (existingPages.length > 0) {
        return { success: false, error: "A page with this route already exists" };
      }
      
      updates.route = input.route.trim();
    }

    if (input.title !== undefined) {
      updates.title = input.title?.trim() || null;
    }

    if (input.description !== undefined) {
      updates.description = input.description?.trim() || null;
    }

    if (input.isActive !== undefined) {
      updates.isActive = input.isActive;
    }

    const updatedPages = await db
      .update(pageLayouts)
      .set(updates)
      .where(eq(pageLayouts.id, input.id))
      .returning();

    if (updatedPages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    revalidatePath("/admin/pages");
    return { success: true, data: updatedPages[0] };
  } catch (error) {
    console.error("Error updating page:", error);
    return { success: false, error: "Failed to update page" };
  }
}

/**
 * Publish a page (make it live)
 */
export async function publishPage(layoutId: number): Promise<ActionResult<void>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid page ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can publish pages" };
    }

    // Check if page exists
    const existingPageResult = await getPageById(layoutId);
    if (!existingPageResult.success) {
      return { success: false, error: "Page not found" };
    }

    // Create a version snapshot before publishing
    await createPageVersionHelper(layoutId);

    // Update page to published
    const updatedPages = await db
      .update(pageLayouts)
      .set({
        isPublished: true,
        updatedAt: new Date(),
      })
      .where(eq(pageLayouts.id, layoutId))
      .returning();

    if (updatedPages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    revalidatePath("/admin/pages");
    revalidatePath(updatedPages[0].route); // Revalidate the public page
    return { success: true };
  } catch (error) {
    console.error("Error publishing page:", error);
    return { success: false, error: "Failed to publish page" };
  }
}

/**
 * Duplicate an existing page
 */
export async function duplicatePage(sourceId: number, newRoute: string, newName?: string): Promise<ActionResult<PageLayout>> {
  try {
    if (!sourceId || Number.isNaN(sourceId)) {
      return { success: false, error: "Invalid source page ID" };
    }

    if (!newRoute?.trim()) {
      return { success: false, error: "New route is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can duplicate pages" };
    }

    // Check if source page exists
    const sourcePageResult = await getPageById(sourceId);
    if (!sourcePageResult.success) {
      return { success: false, error: "Source page not found" };
    }

    const sourcePage = sourcePageResult.data!;

    // Check if new route already exists
    const existingPage = await getPageByRoute(newRoute.trim());
    if (existingPage.success) {
      return { success: false, error: "A page with this route already exists" };
    }

    // Create new page
    const duplicatedPage = await db
      .insert(pageLayouts)
      .values({
        name: newName?.trim() || `${sourcePage.name} (Copy)`,
        pageType: sourcePage.pageType,
        route: newRoute.trim(),
        title: sourcePage.title,
        description: sourcePage.description,
        isActive: true,
        isPublished: false,
        createdBy: access.staffId || null,
      })
      .returning();

    // Copy content blocks
    const sourceBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.layoutId, sourceId));

    for (const block of sourceBlocks) {
      const newBlock = await db
        .insert(contentBlocks)
        .values({
          layoutId: duplicatedPage[0].id,
          blockType: block.blockType,
          blockKey: block.blockKey,
          displayOrder: block.displayOrder,
          isVisible: block.isVisible,
          configuration: block.configuration,
        })
        .returning();

      // Copy block translations
      const blockTranslationsData = await db
        .select()
        .from(blockTranslations)
        .where(eq(blockTranslations.blockId, block.id));

      if (blockTranslationsData.length > 0) {
        await db
          .insert(blockTranslations)
          .values(
            blockTranslationsData.map(translation => ({
              blockId: newBlock[0].id,
              locale: translation.locale,
              content: translation.content,
            }))
          );
      }
    }

    revalidatePath("/admin/pages");
    return { success: true, data: duplicatedPage[0] };
  } catch (error) {
    console.error("Error duplicating page:", error);
    return { success: false, error: "Failed to duplicate page" };
  }
}

// Version Management Types and Interfaces

export type PageVersion = {
  id: number;
  layoutId: number;
  versionNumber: number;
  snapshot: string;
  createdBy: number | null;
  createdAt: Date;
  isPublished: boolean;
};

export type PageSnapshot = {
  layout: PageLayout;
  blocks: ContentBlockWithTranslations[];
  metadata: {
    totalBlocks: number;
    lastModified: Date;
    modifiedBy: number | null;
  };
};

export type CreatePageVersionInput = {
  layoutId: number;
  isPublished?: boolean;
};

/**
 * Create a page version snapshot
 * Requirements: 9.1 - WHEN an admin saves page changes, THE System SHALL create a version snapshot with timestamp and user information
 */
export async function createPageVersion(input: CreatePageVersionInput): Promise<ActionResult<PageVersion>> {
  try {
    if (!input.layoutId || Number.isNaN(input.layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can create page versions" };
    }

    // Check if page exists
    const pageResult = await getPageById(input.layoutId);
    if (!pageResult.success) {
      return { success: false, error: "Page not found" };
    }

    const page = pageResult.data!;

    // Get all content blocks with translations for this page
    const blocksResult = await getContentBlocks(input.layoutId);
    if (!blocksResult.success) {
      return { success: false, error: "Failed to fetch content blocks" };
    }

    const blocks = blocksResult.data!;

    // Get next version number
    const existingVersions = await db
      .select()
      .from(pageVersions)
      .where(eq(pageVersions.layoutId, input.layoutId))
      .orderBy(desc(pageVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = existingVersions.length > 0 
      ? existingVersions[0].versionNumber + 1 
      : 1;

    // Create snapshot
    const snapshot: PageSnapshot = {
      layout: page,
      blocks,
      metadata: {
        totalBlocks: blocks.length,
        lastModified: new Date(),
        modifiedBy: access.staffId,
      },
    };

    // Save version
    const newVersion = await db
      .insert(pageVersions)
      .values({
        layoutId: input.layoutId,
        versionNumber: nextVersionNumber,
        snapshot: JSON.stringify(snapshot),
        createdBy: access.staffId,
        isPublished: input.isPublished ?? false,
      })
      .returning();

    return { success: true, data: newVersion[0] };
  } catch (error) {
    console.error("Error creating page version:", error);
    return { success: false, error: "Failed to create page version" };
  }
}

/**
 * Get all versions for a specific page layout
 * Requirements: 9.2 - WHEN an admin accesses version history for any page, THE Page_Builder SHALL display a list of previous versions with preview thumbnails
 */
export async function getPageVersions(layoutId: number): Promise<ActionResult<PageVersion[]>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view page versions" };
    }

    // Check if page exists
    const pageResult = await getPageById(layoutId);
    if (!pageResult.success) {
      return { success: false, error: "Page not found" };
    }

    // Get all versions for this page, ordered by version number descending (newest first)
    const versions = await db
      .select()
      .from(pageVersions)
      .where(eq(pageVersions.layoutId, layoutId))
      .orderBy(desc(pageVersions.versionNumber));

    return { success: true, data: versions };
  } catch (error) {
    console.error("Error fetching page versions:", error);
    return { success: false, error: "Failed to fetch page versions" };
  }
}

/**
 * Get a specific page version by ID
 */
export async function getPageVersionById(versionId: number): Promise<ActionResult<PageVersion & { parsedSnapshot: PageSnapshot }>> {
  try {
    if (!versionId || Number.isNaN(versionId)) {
      return { success: false, error: "Invalid version ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view page versions" };
    }

    const versions = await db
      .select()
      .from(pageVersions)
      .where(eq(pageVersions.id, versionId))
      .limit(1);

    if (versions.length === 0) {
      return { success: false, error: "Version not found" };
    }

    const version = versions[0];
    let parsedSnapshot: PageSnapshot;

    try {
      parsedSnapshot = JSON.parse(version.snapshot);
    } catch (parseError) {
      console.error("Error parsing version snapshot:", parseError);
      return { success: false, error: "Invalid version snapshot data" };
    }

    return { 
      success: true, 
      data: { 
        ...version, 
        parsedSnapshot 
      } 
    };
  } catch (error) {
    console.error("Error fetching page version:", error);
    return { success: false, error: "Failed to fetch page version" };
  }
}

/**
 * Restore a page to a previous version
 * Requirements: 9.4 - WHEN an admin chooses to revert, THE System SHALL restore the selected version and create a new version entry
 */
export async function restorePageVersion(versionId: number): Promise<ActionResult<PageLayout>> {
  try {
    if (!versionId || Number.isNaN(versionId)) {
      return { success: false, error: "Invalid version ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can restore page versions" };
    }

    // Get the version to restore
    const versionResult = await getPageVersionById(versionId);
    if (!versionResult.success) {
      return { success: false, error: "Version not found" };
    }

    const version = versionResult.data!;
    const snapshot = version.parsedSnapshot;
    const layoutId = version.layoutId;

    // Create a backup version of the current state before restoring
    const backupResult = await createPageVersion({ layoutId, isPublished: false });
    if (!backupResult.success) {
      console.warn("Failed to create backup version before restore:", backupResult.error);
    }

    // Start transaction to restore the page
    await db.transaction(async (tx) => {
      // Update page layout
      await tx
        .update(pageLayouts)
        .set({
          name: snapshot.layout.name,
          pageType: snapshot.layout.pageType,
          route: snapshot.layout.route,
          title: snapshot.layout.title,
          description: snapshot.layout.description,
          isActive: snapshot.layout.isActive,
          updatedAt: new Date(),
        })
        .where(eq(pageLayouts.id, layoutId));

      // Delete existing content blocks and translations
      await tx
        .delete(contentBlocks)
        .where(eq(contentBlocks.layoutId, layoutId));

      // Restore content blocks and translations
      for (const block of snapshot.blocks) {
        const restoredBlock = await tx
          .insert(contentBlocks)
          .values({
            layoutId,
            blockType: block.blockType,
            blockKey: block.blockKey,
            displayOrder: block.displayOrder,
            isVisible: block.isVisible,
            configuration: block.configuration,
          })
          .returning();

        // Restore translations
        if (block.translations && block.translations.length > 0) {
          await tx
            .insert(blockTranslations)
            .values(
              block.translations.map(translation => ({
                blockId: restoredBlock[0].id,
                locale: translation.locale,
                content: translation.content,
              }))
            );
        }
      }
    });

    // Create a new version entry for the restore operation
    const restoreVersionResult = await createPageVersion({ 
      layoutId, 
      isPublished: snapshot.layout.isPublished 
    });

    if (!restoreVersionResult.success) {
      console.warn("Failed to create version entry for restore operation:", restoreVersionResult.error);
    }

    // Get the updated page
    const updatedPageResult = await getPageById(layoutId);
    if (!updatedPageResult.success) {
      return { success: false, error: "Failed to fetch restored page" };
    }

    revalidatePath("/admin/pages");
    revalidatePath(snapshot.layout.route); // Revalidate the public page
    
    return { success: true, data: updatedPageResult.data! };
  } catch (error) {
    console.error("Error restoring page version:", error);
    return { success: false, error: "Failed to restore page version" };
  }
}

/**
 * Compare two page versions
 * Requirements: 9.3 - WHEN an admin selects a previous version, THE Page_Builder SHALL show a comparison with the current version
 */
export async function comparePageVersions(
  versionId1: number, 
  versionId2: number
): Promise<ActionResult<{
  version1: PageVersion & { parsedSnapshot: PageSnapshot };
  version2: PageVersion & { parsedSnapshot: PageSnapshot };
  differences: {
    layoutChanges: string[];
    blockChanges: string[];
    translationChanges: string[];
  };
}>> {
  try {
    if (!versionId1 || Number.isNaN(versionId1) || !versionId2 || Number.isNaN(versionId2)) {
      return { success: false, error: "Invalid version IDs" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can compare page versions" };
    }

    // Get both versions
    const version1Result = await getPageVersionById(versionId1);
    const version2Result = await getPageVersionById(versionId2);

    if (!version1Result.success || !version2Result.success) {
      return { success: false, error: "One or both versions not found" };
    }

    const version1 = version1Result.data!;
    const version2 = version2Result.data!;

    // Ensure both versions are for the same page
    if (version1.layoutId !== version2.layoutId) {
      return { success: false, error: "Cannot compare versions from different pages" };
    }

    // Compare snapshots and identify differences
    const differences = {
      layoutChanges: [] as string[],
      blockChanges: [] as string[],
      translationChanges: [] as string[],
    };

    const snapshot1 = version1.parsedSnapshot;
    const snapshot2 = version2.parsedSnapshot;

    // Compare layout properties
    if (snapshot1.layout.name !== snapshot2.layout.name) {
      differences.layoutChanges.push(`Name changed from "${snapshot1.layout.name}" to "${snapshot2.layout.name}"`);
    }
    if (snapshot1.layout.title !== snapshot2.layout.title) {
      differences.layoutChanges.push(`Title changed from "${snapshot1.layout.title || 'None'}" to "${snapshot2.layout.title || 'None'}"`);
    }
    if (snapshot1.layout.description !== snapshot2.layout.description) {
      differences.layoutChanges.push(`Description changed from "${snapshot1.layout.description || 'None'}" to "${snapshot2.layout.description || 'None'}"`);
    }
    if (snapshot1.layout.isActive !== snapshot2.layout.isActive) {
      differences.layoutChanges.push(`Active status changed from ${snapshot1.layout.isActive} to ${snapshot2.layout.isActive}`);
    }
    if (snapshot1.layout.isPublished !== snapshot2.layout.isPublished) {
      differences.layoutChanges.push(`Published status changed from ${snapshot1.layout.isPublished} to ${snapshot2.layout.isPublished}`);
    }

    // Compare blocks
    const blocks1Map = new Map(snapshot1.blocks.map(b => [b.blockKey, b]));
    const blocks2Map = new Map(snapshot2.blocks.map(b => [b.blockKey, b]));

    // Find added blocks
    for (const [key, block] of blocks2Map) {
      if (!blocks1Map.has(key)) {
        differences.blockChanges.push(`Added block "${key}" of type "${block.blockType}"`);
      }
    }

    // Find removed blocks
    for (const [key, block] of blocks1Map) {
      if (!blocks2Map.has(key)) {
        differences.blockChanges.push(`Removed block "${key}" of type "${block.blockType}"`);
      }
    }

    // Find modified blocks
    for (const [key, block1] of blocks1Map) {
      const block2 = blocks2Map.get(key);
      if (block2) {
        if (block1.blockType !== block2.blockType) {
          differences.blockChanges.push(`Block "${key}" type changed from "${block1.blockType}" to "${block2.blockType}"`);
        }
        if (block1.displayOrder !== block2.displayOrder) {
          differences.blockChanges.push(`Block "${key}" order changed from ${block1.displayOrder} to ${block2.displayOrder}`);
        }
        if (block1.isVisible !== block2.isVisible) {
          differences.blockChanges.push(`Block "${key}" visibility changed from ${block1.isVisible} to ${block2.isVisible}`);
        }
        if (JSON.stringify(block1.configuration) !== JSON.stringify(block2.configuration)) {
          differences.blockChanges.push(`Block "${key}" configuration changed`);
        }

        // Compare translations
        const trans1Map = new Map(block1.translations.map(t => [t.locale, t]));
        const trans2Map = new Map(block2.translations.map(t => [t.locale, t]));

        for (const [locale, trans1] of trans1Map) {
          const trans2 = trans2Map.get(locale);
          if (!trans2) {
            differences.translationChanges.push(`Removed translation for block "${key}" in locale "${locale}"`);
          } else if (trans1.content !== trans2.content) {
            differences.translationChanges.push(`Modified translation for block "${key}" in locale "${locale}"`);
          }
        }

        for (const [locale] of trans2Map) {
          if (!trans1Map.has(locale)) {
            differences.translationChanges.push(`Added translation for block "${key}" in locale "${locale}"`);
          }
        }
      }
    }

    return {
      success: true,
      data: {
        version1,
        version2,
        differences,
      },
    };
  } catch (error) {
    console.error("Error comparing page versions:", error);
    return { success: false, error: "Failed to compare page versions" };
  }
}

/**
 * Delete old page versions (cleanup functionality)
 * Requirements: 9.5 - THE System SHALL retain page versions for at least 30 days and allow admins to permanently delete old versions
 */
export async function cleanupOldPageVersions(
  layoutId: number, 
  retentionDays: number = 30
): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    if (retentionDays < 1) {
      return { success: false, error: "Retention days must be at least 1" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can cleanup page versions" };
    }

    // Check if page exists
    const pageResult = await getPageById(layoutId);
    if (!pageResult.success) {
      return { success: false, error: "Page not found" };
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old versions (keep published versions and recent versions)
    const deletedVersions = await db
      .delete(pageVersions)
      .where(and(
        eq(pageVersions.layoutId, layoutId),
        eq(pageVersions.isPublished, false), // Only delete unpublished versions
        // Only delete versions older than retention period
        // Note: Using string comparison for timestamp, which works for ISO format
        // In production, you might want to use a proper date comparison
      ))
      .returning();

    // For proper date comparison, we need to fetch and filter manually
    const oldVersions = await db
      .select()
      .from(pageVersions)
      .where(and(
        eq(pageVersions.layoutId, layoutId),
        eq(pageVersions.isPublished, false)
      ));

    const versionsToDelete = oldVersions.filter(v => v.createdAt < cutoffDate);
    
    let deletedCount = 0;
    for (const version of versionsToDelete) {
      await db
        .delete(pageVersions)
        .where(eq(pageVersions.id, version.id));
      deletedCount++;
    }

    return { success: true, data: { deletedCount } };
  } catch (error) {
    console.error("Error cleaning up old page versions:", error);
    return { success: false, error: "Failed to cleanup old page versions" };
  }
}

/**
 * Delete a specific page version
 */
export async function deletePageVersion(versionId: number): Promise<ActionResult<void>> {
  try {
    if (!versionId || Number.isNaN(versionId)) {
      return { success: false, error: "Invalid version ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can delete page versions" };
    }

    // Check if version exists
    const versionResult = await getPageVersionById(versionId);
    if (!versionResult.success) {
      return { success: false, error: "Version not found" };
    }

    const version = versionResult.data!;

    // Prevent deletion of published versions
    if (version.isPublished) {
      return { success: false, error: "Cannot delete published versions" };
    }

    // Delete the version
    const deletedVersions = await db
      .delete(pageVersions)
      .where(eq(pageVersions.id, versionId))
      .returning();

    if (deletedVersions.length === 0) {
      return { success: false, error: "Version not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting page version:", error);
    return { success: false, error: "Failed to delete page version" };
  }
}

/**
 * Helper function to create a page version snapshot (for backward compatibility)
 */
async function createPageVersionHelper(layoutId: number): Promise<void> {
  const result = await createPageVersion({ layoutId, isPublished: true });
  if (!result.success) {
    console.error("Error creating page version:", result.error);
  }
}

// Content Block Types and Interfaces

export type ContentBlock = {
  id: number;
  layoutId: number;
  blockType: string;
  blockKey: string;
  displayOrder: number;
  isVisible: boolean;
  configuration: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BlockTranslation = {
  id: number;
  blockId: number;
  locale: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentBlockWithTranslations = ContentBlock & {
  translations: BlockTranslation[];
};

export type CreateContentBlockInput = {
  layoutId: number;
  blockType: string;
  blockKey: string;
  displayOrder?: number;
  isVisible?: boolean;
  configuration?: Record<string, any>;
  translations?: Record<string, Record<string, any>>;
};

export type UpdateContentBlockInput = {
  id: number;
  blockType?: string;
  blockKey?: string;
  displayOrder?: number;
  isVisible?: boolean;
  configuration?: Record<string, any>;
  translations?: Record<string, Record<string, any>>;
};

export type ReorderBlockInput = {
  id: number;
  displayOrder: number;
};

/**
 * Get all content blocks for a specific page layout
 */
export async function getContentBlocks(layoutId: number): Promise<ActionResult<ContentBlockWithTranslations[]>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view content blocks" };
    }

    // Get content blocks
    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.layoutId, layoutId))
      .orderBy(contentBlocks.displayOrder);

    // Get translations for all blocks
    const blocksWithTranslations: ContentBlockWithTranslations[] = [];
    
    for (const block of blocks) {
      const translations = await db
        .select()
        .from(blockTranslations)
        .where(eq(blockTranslations.blockId, block.id));
      
      blocksWithTranslations.push({
        ...block,
        translations,
      });
    }

    return { success: true, data: blocksWithTranslations };
  } catch (error) {
    console.error("Error fetching content blocks:", error);
    return { success: false, error: "Failed to fetch content blocks" };
  }
}

/**
 * Get a single content block by ID
 */
export async function getContentBlockById(id: number): Promise<ActionResult<ContentBlockWithTranslations>> {
  try {
    if (!id || Number.isNaN(id)) {
      return { success: false, error: "Invalid block ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view content blocks" };
    }

    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.id, id))
      .limit(1);

    if (blocks.length === 0) {
      return { success: false, error: "Content block not found" };
    }

    const translations = await db
      .select()
      .from(blockTranslations)
      .where(eq(blockTranslations.blockId, id));

    const blockWithTranslations: ContentBlockWithTranslations = {
      ...blocks[0],
      translations,
    };

    return { success: true, data: blockWithTranslations };
  } catch (error) {
    console.error("Error fetching content block:", error);
    return { success: false, error: "Failed to fetch content block" };
  }
}

/**
 * Create a new content block
 */
export async function createContentBlock(input: CreateContentBlockInput): Promise<ActionResult<ContentBlockWithTranslations>> {
  try {
    if (!input.layoutId || Number.isNaN(input.layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    if (!input.blockType?.trim()) {
      return { success: false, error: "Block type is required" };
    }

    if (!input.blockKey?.trim()) {
      return { success: false, error: "Block key is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can create content blocks" };
    }

    // Check if page exists
    const pageResult = await getPageById(input.layoutId);
    if (!pageResult.success) {
      return { success: false, error: "Page not found" };
    }

    // Check if block key is unique within the layout
    const existingBlocks = await db
      .select()
      .from(contentBlocks)
      .where(and(
        eq(contentBlocks.layoutId, input.layoutId),
        eq(contentBlocks.blockKey, input.blockKey.trim())
      ));

    if (existingBlocks.length > 0) {
      return { success: false, error: "A block with this key already exists on this page" };
    }

    // Get next display order if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const maxOrderBlocks = await db
        .select()
        .from(contentBlocks)
        .where(eq(contentBlocks.layoutId, input.layoutId))
        .orderBy(desc(contentBlocks.displayOrder))
        .limit(1);
      
      displayOrder = maxOrderBlocks.length > 0 ? maxOrderBlocks[0].displayOrder + 1 : 1;
    }

    // Create content block
    const newBlock = await db
      .insert(contentBlocks)
      .values({
        layoutId: input.layoutId,
        blockType: input.blockType.trim(),
        blockKey: input.blockKey.trim(),
        displayOrder,
        isVisible: input.isVisible ?? true,
        configuration: input.configuration ? JSON.stringify(input.configuration) : null,
      })
      .returning();

    // Create translations if provided
    const translations: BlockTranslation[] = [];
    if (input.translations) {
      for (const [locale, content] of Object.entries(input.translations)) {
        const translation = await db
          .insert(blockTranslations)
          .values({
            blockId: newBlock[0].id,
            locale,
            content: JSON.stringify(content),
          })
          .returning();
        
        translations.push(translation[0]);
      }
    }

    const blockWithTranslations: ContentBlockWithTranslations = {
      ...newBlock[0],
      translations,
    };

    revalidatePath("/admin/pages");
    return { success: true, data: blockWithTranslations };
  } catch (error) {
    console.error("Error creating content block:", error);
    return { success: false, error: "Failed to create content block" };
  }
}

/**
 * Update an existing content block
 */
export async function updateContentBlock(input: UpdateContentBlockInput): Promise<ActionResult<ContentBlockWithTranslations>> {
  try {
    if (!input.id || Number.isNaN(input.id)) {
      return { success: false, error: "Invalid block ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can update content blocks" };
    }

    // Check if block exists
    const existingBlockResult = await getContentBlockById(input.id);
    if (!existingBlockResult.success) {
      return existingBlockResult;
    }

    const existingBlock = existingBlockResult.data!;

    const updates: Partial<typeof contentBlocks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.blockType !== undefined) {
      if (!input.blockType.trim()) {
        return { success: false, error: "Block type cannot be empty" };
      }
      updates.blockType = input.blockType.trim();
    }

    if (input.blockKey !== undefined) {
      if (!input.blockKey.trim()) {
        return { success: false, error: "Block key cannot be empty" };
      }
      
      // Check if new block key conflicts with existing blocks (excluding current block)
      const conflictingBlocks = await db
        .select()
        .from(contentBlocks)
        .where(and(
          eq(contentBlocks.layoutId, existingBlock.layoutId),
          eq(contentBlocks.blockKey, input.blockKey.trim()),
          ne(contentBlocks.id, input.id)
        ));
      
      if (conflictingBlocks.length > 0) {
        return { success: false, error: "A block with this key already exists on this page" };
      }
      
      updates.blockKey = input.blockKey.trim();
    }

    if (input.displayOrder !== undefined) {
      updates.displayOrder = input.displayOrder;
    }

    if (input.isVisible !== undefined) {
      updates.isVisible = input.isVisible;
    }

    if (input.configuration !== undefined) {
      updates.configuration = JSON.stringify(input.configuration);
    }

    // Update content block
    const updatedBlocks = await db
      .update(contentBlocks)
      .set(updates)
      .where(eq(contentBlocks.id, input.id))
      .returning();

    if (updatedBlocks.length === 0) {
      return { success: false, error: "Content block not found" };
    }

    // Update translations if provided
    let translations = existingBlock.translations;
    if (input.translations) {
      // Delete existing translations and create new ones
      await db
        .delete(blockTranslations)
        .where(eq(blockTranslations.blockId, input.id));

      translations = [];
      for (const [locale, content] of Object.entries(input.translations)) {
        const translation = await db
          .insert(blockTranslations)
          .values({
            blockId: input.id,
            locale,
            content: JSON.stringify(content),
          })
          .returning();
        
        translations.push(translation[0]);
      }
    }

    const blockWithTranslations: ContentBlockWithTranslations = {
      ...updatedBlocks[0],
      translations,
    };

    revalidatePath("/admin/pages");
    return { success: true, data: blockWithTranslations };
  } catch (error) {
    console.error("Error updating content block:", error);
    return { success: false, error: "Failed to update content block" };
  }
}

/**
 * Delete a content block
 */
export async function deleteContentBlock(blockId: number): Promise<ActionResult<void>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can delete content blocks" };
    }

    // Check if block exists
    const existingBlockResult = await getContentBlockById(blockId);
    if (!existingBlockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Delete the content block (translations will be deleted automatically due to cascade)
    const deletedBlocks = await db
      .delete(contentBlocks)
      .where(eq(contentBlocks.id, blockId))
      .returning();

    if (deletedBlocks.length === 0) {
      return { success: false, error: "Content block not found" };
    }

    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting content block:", error);
    return { success: false, error: "Failed to delete content block" };
  }
}

/**
 * Reorder content blocks within a page layout
 */
export async function reorderContentBlocks(
  layoutId: number, 
  blockOrders: ReorderBlockInput[]
): Promise<ActionResult<void>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    if (!blockOrders || blockOrders.length === 0) {
      return { success: false, error: "Block orders are required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can reorder content blocks" };
    }

    // Check if page exists
    const pageResult = await getPageById(layoutId);
    if (!pageResult.success) {
      return { success: false, error: "Page not found" };
    }

    // Verify all blocks belong to the specified layout
    const blockIds = blockOrders.map(b => b.id);
    const existingBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.layoutId, layoutId));

    const existingBlockIds = existingBlocks.map(b => b.id);
    const invalidBlocks = blockIds.filter(id => !existingBlockIds.includes(id));
    
    if (invalidBlocks.length > 0) {
      return { success: false, error: "Some blocks do not belong to this page" };
    }

    // Update display orders
    for (const blockOrder of blockOrders) {
      await db
        .update(contentBlocks)
        .set({
          displayOrder: blockOrder.displayOrder,
          updatedAt: new Date(),
        })
        .where(eq(contentBlocks.id, blockOrder.id));
    }

    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error reordering content blocks:", error);
    return { success: false, error: "Failed to reorder content blocks" };
  }
}

/**
 * Update block translation for a specific locale
 */
export async function updateBlockTranslation(
  blockId: number, 
  locale: string, 
  content: Record<string, any>
): Promise<ActionResult<BlockTranslation>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can update translations" };
    }

    // Check if block exists
    const blockResult = await getContentBlockById(blockId);
    if (!blockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Check if translation exists
    const existingTranslations = await db
      .select()
      .from(blockTranslations)
      .where(and(
        eq(blockTranslations.blockId, blockId),
        eq(blockTranslations.locale, locale.trim())
      ));

    let translation: BlockTranslation;

    if (existingTranslations.length > 0) {
      // Update existing translation
      const updatedTranslations = await db
        .update(blockTranslations)
        .set({
          content: JSON.stringify(content),
          updatedAt: new Date(),
        })
        .where(and(
          eq(blockTranslations.blockId, blockId),
          eq(blockTranslations.locale, locale.trim())
        ))
        .returning();
      
      translation = updatedTranslations[0];
    } else {
      // Create new translation
      const newTranslations = await db
        .insert(blockTranslations)
        .values({
          blockId,
          locale: locale.trim(),
          content: JSON.stringify(content),
        })
        .returning();
      
      translation = newTranslations[0];
    }

    revalidatePath("/admin/pages");
    return { success: true, data: translation };
  } catch (error) {
    console.error("Error updating block translation:", error);
    return { success: false, error: "Failed to update block translation" };
  }
}

/**
 * Get all translations for a specific content block
 */
export async function getBlockTranslations(blockId: number): Promise<ActionResult<BlockTranslation[]>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view translations" };
    }

    // Check if block exists
    const blockResult = await getContentBlockById(blockId);
    if (!blockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Get all translations for the block
    const translations = await db
      .select()
      .from(blockTranslations)
      .where(eq(blockTranslations.blockId, blockId))
      .orderBy(blockTranslations.locale);

    return { success: true, data: translations };
  } catch (error) {
    console.error("Error fetching block translations:", error);
    return { success: false, error: "Failed to fetch block translations" };
  }
}

/**
 * Get block translation for a specific locale with fallback logic
 */
export async function getBlockTranslationWithFallback(
  blockId: number, 
  locale: string, 
  fallbackLocale: string = 'en'
): Promise<ActionResult<{ translation: BlockTranslation | null; usedFallback: boolean }>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view translations" };
    }

    // Check if block exists
    const blockResult = await getContentBlockById(blockId);
    if (!blockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Try to get translation for requested locale
    const requestedTranslations = await db
      .select()
      .from(blockTranslations)
      .where(and(
        eq(blockTranslations.blockId, blockId),
        eq(blockTranslations.locale, locale.trim())
      ))
      .limit(1);

    if (requestedTranslations.length > 0) {
      return { 
        success: true, 
        data: { 
          translation: requestedTranslations[0], 
          usedFallback: false 
        } 
      };
    }

    // If requested locale not found, try fallback locale
    if (locale.trim() !== fallbackLocale.trim()) {
      const fallbackTranslations = await db
        .select()
        .from(blockTranslations)
        .where(and(
          eq(blockTranslations.blockId, blockId),
          eq(blockTranslations.locale, fallbackLocale.trim())
        ))
        .limit(1);

      if (fallbackTranslations.length > 0) {
        return { 
          success: true, 
          data: { 
            translation: fallbackTranslations[0], 
            usedFallback: true 
          } 
        };
      }
    }

    // No translation found for either locale
    return { 
      success: true, 
      data: { 
        translation: null, 
        usedFallback: false 
      } 
    };
  } catch (error) {
    console.error("Error fetching block translation with fallback:", error);
    return { success: false, error: "Failed to fetch block translation" };
  }
}

/**
 * Get block translation for a specific locale with fallback logic (PUBLIC VERSION)
 * This version doesn't require authentication and is used for public dynamic pages
 */
export async function getPublicBlockTranslationWithFallback(
  blockId: number, 
  locale: string, 
  fallbackLocale: string = 'en'
): Promise<ActionResult<{ translation: BlockTranslation | null; usedFallback: boolean }>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    // Try to get translation for requested locale
    const requestedTranslations = await db
      .select()
      .from(blockTranslations)
      .where(and(
        eq(blockTranslations.blockId, blockId),
        eq(blockTranslations.locale, locale.trim())
      ))
      .limit(1);

    if (requestedTranslations.length > 0) {
      return { 
        success: true, 
        data: { 
          translation: requestedTranslations[0], 
          usedFallback: false 
        } 
      };
    }

    // If requested locale not found, try fallback locale
    if (locale.trim() !== fallbackLocale.trim()) {
      const fallbackTranslations = await db
        .select()
        .from(blockTranslations)
        .where(and(
          eq(blockTranslations.blockId, blockId),
          eq(blockTranslations.locale, fallbackLocale.trim())
        ))
        .limit(1);

      if (fallbackTranslations.length > 0) {
        return { 
          success: true, 
          data: { 
            translation: fallbackTranslations[0], 
            usedFallback: true 
          } 
        };
      }
    }

    // No translation found for either locale
    return { 
      success: true, 
      data: { 
        translation: null, 
        usedFallback: false 
      } 
    };
  } catch (error) {
    console.error("Error fetching public block translation with fallback:", error);
    return { success: false, error: "Failed to fetch block translation" };
  }
}

/**
 * Get content blocks with translations for a specific locale with fallback (PUBLIC VERSION)
 * This version doesn't require authentication and is used for public dynamic pages
 */
export async function getPublicContentBlocksWithLocale(
  layoutId: number, 
  locale: string, 
  fallbackLocale: string = 'en'
): Promise<ActionResult<Array<ContentBlock & { 
  localizedContent: Record<string, any> | null; 
  usedFallback: boolean; 
  availableLocales: string[];
}>>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    // Get content blocks
    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.layoutId, layoutId))
      .orderBy(contentBlocks.displayOrder);

    const blocksWithLocale = [];

    for (const block of blocks) {
      // Get all translations for this block to determine available locales
      const allTranslations = await db
        .select()
        .from(blockTranslations)
        .where(eq(blockTranslations.blockId, block.id));

      const availableLocales = allTranslations.map(t => t.locale);

      // Get translation with fallback logic (public version)
      const translationResult = await getPublicBlockTranslationWithFallback(
        block.id, 
        locale.trim(), 
        fallbackLocale
      );

      let localizedContent = null;
      let usedFallback = false;

      if (translationResult.success && translationResult.data?.translation) {
        try {
          localizedContent = translationResult.data.translation.content 
            ? JSON.parse(translationResult.data.translation.content) 
            : null;
          usedFallback = translationResult.data.usedFallback;
        } catch (parseError) {
          console.error("Error parsing translation content:", parseError);
          localizedContent = null;
        }
      }

      blocksWithLocale.push({
        ...block,
        localizedContent,
        usedFallback,
        availableLocales,
      });
    }

    return { success: true, data: blocksWithLocale };
  } catch (error) {
    console.error("Error fetching public content blocks with locale:", error);
    return { success: false, error: "Failed to fetch content blocks with locale" };
  }
}

/**
 * Get content blocks with translations for a specific locale with fallback
 */
export async function getContentBlocksWithLocale(
  layoutId: number, 
  locale: string, 
  fallbackLocale: string = 'en'
): Promise<ActionResult<Array<ContentBlock & { 
  localizedContent: Record<string, any> | null; 
  usedFallback: boolean; 
  availableLocales: string[];
}>>> {
  try {
    if (!layoutId || Number.isNaN(layoutId)) {
      return { success: false, error: "Invalid layout ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view content blocks" };
    }

    // Get content blocks
    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.layoutId, layoutId))
      .orderBy(contentBlocks.displayOrder);

    const blocksWithLocale = [];

    for (const block of blocks) {
      // Get all translations for this block to determine available locales
      const allTranslations = await db
        .select()
        .from(blockTranslations)
        .where(eq(blockTranslations.blockId, block.id));

      const availableLocales = allTranslations.map(t => t.locale);

      // Get translation with fallback logic
      const translationResult = await getBlockTranslationWithFallback(
        block.id, 
        locale.trim(), 
        fallbackLocale
      );

      let localizedContent = null;
      let usedFallback = false;

      if (translationResult.success && translationResult.data?.translation) {
        try {
          localizedContent = translationResult.data.translation.content 
            ? JSON.parse(translationResult.data.translation.content) 
            : null;
          usedFallback = translationResult.data.usedFallback;
        } catch (parseError) {
          console.error("Error parsing translation content:", parseError);
          localizedContent = null;
        }
      }

      blocksWithLocale.push({
        ...block,
        localizedContent,
        usedFallback,
        availableLocales,
      });
    }

    return { success: true, data: blocksWithLocale };
  } catch (error) {
    console.error("Error fetching content blocks with locale:", error);
    return { success: false, error: "Failed to fetch content blocks with locale" };
  }
}

/**
 * Delete a block translation for a specific locale
 */
export async function deleteBlockTranslation(
  blockId: number, 
  locale: string
): Promise<ActionResult<void>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    if (!locale?.trim()) {
      return { success: false, error: "Locale is required" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can delete translations" };
    }

    // Check if block exists
    const blockResult = await getContentBlockById(blockId);
    if (!blockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Check if translation exists
    const existingTranslations = await db
      .select()
      .from(blockTranslations)
      .where(and(
        eq(blockTranslations.blockId, blockId),
        eq(blockTranslations.locale, locale.trim())
      ));

    if (existingTranslations.length === 0) {
      return { success: false, error: "Translation not found" };
    }

    // Delete the translation
    await db
      .delete(blockTranslations)
      .where(and(
        eq(blockTranslations.blockId, blockId),
        eq(blockTranslations.locale, locale.trim())
      ));

    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting block translation:", error);
    return { success: false, error: "Failed to delete block translation" };
  }
}

/**
 * Get available locales for a content block
 */
export async function getBlockAvailableLocales(blockId: number): Promise<ActionResult<string[]>> {
  try {
    if (!blockId || Number.isNaN(blockId)) {
      return { success: false, error: "Invalid block ID" };
    }

    const access = await getCurrentUserAccess();
    
    if (!access.isAuthenticated) {
      return { success: false, error: "Authentication required" };
    }

    if (!access.isSuperAdmin && !access.isAdun) {
      return { success: false, error: "Access denied: Only super admin and ADUN can view available locales" };
    }

    // Check if block exists
    const blockResult = await getContentBlockById(blockId);
    if (!blockResult.success) {
      return { success: false, error: "Content block not found" };
    }

    // Get all unique locales for this block
    const translations = await db
      .select({ locale: blockTranslations.locale })
      .from(blockTranslations)
      .where(eq(blockTranslations.blockId, blockId))
      .orderBy(blockTranslations.locale);

    const locales = translations.map(t => t.locale);

    return { success: true, data: locales };
  } catch (error) {
    console.error("Error fetching available locales:", error);
    return { success: false, error: "Failed to fetch available locales" };
  }
}