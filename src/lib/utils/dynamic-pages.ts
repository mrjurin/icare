/**
 * Dynamic Page Utilities
 * 
 * Server-side utilities for fetching and rendering dynamic pages
 * from the page builder system.
 */

import { getPageByRoute, getPublicContentBlocksWithLocale } from "@/lib/actions/pages";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export interface DynamicPageData {
  page: {
    id: number;
    name: string;
    pageType: string;
    route: string;
    title: string | null;
    description: string | null;
    isActive: boolean;
    isPublished: boolean;
  };
  blocks: Array<{
    id: number;
    layoutId: number;
    blockType: string;
    blockKey: string;
    displayOrder: number;
    isVisible: boolean;
    configuration: string | null;
    localizedContent: Record<string, any> | null;
    usedFallback: boolean;
    availableLocales: string[];
  }>;
  locale: string;
}

/**
 * Fetch dynamic page data by route
 */
export async function getDynamicPageData(route: string, locale?: string): Promise<DynamicPageData> {
  const currentLocale = locale || await getLocale();
  
  // Ensure route starts with /
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  
  // Get page by route
  const pageResult = await getPageByRoute(normalizedRoute);
  if (!pageResult.success || !pageResult.data) {
    notFound();
  }

  const page = pageResult.data;

  // Check if page is published and active
  if (!page.isPublished || !page.isActive) {
    notFound();
  }

  // Get content blocks with localized content
  const blocksResult = await getPublicContentBlocksWithLocale(page.id, currentLocale, 'en');
  if (!blocksResult.success) {
    throw new Error('Failed to fetch page content');
  }

  return {
    page,
    blocks: blocksResult.data || [],
    locale: currentLocale
  };
}

/**
 * Generate metadata for dynamic pages
 */
export async function generateDynamicPageMetadata(route: string, locale?: string) {
  try {
    const data = await getDynamicPageData(route, locale);
    
    return {
      title: data.page.title || data.page.name,
      description: data.page.description || `${data.page.name} - Community Platform`,
      openGraph: {
        title: data.page.title || data.page.name,
        description: data.page.description || `${data.page.name} - Community Platform`,
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }
}

/**
 * Check if a route should use dynamic rendering
 */
export function isDynamicRoute(route: string): boolean {
  // List of routes that should use dynamic rendering
  const dynamicRoutes = [
    '/terms-of-service',
    '/privacy-policy', 
    '/how-it-works',
    '/about',
    '/contact',
    '/view-reports'
  ];
  
  return dynamicRoutes.includes(route);
}

/**
 * Convert content blocks to the format expected by DynamicPageRenderer
 */
export function formatBlocksForRenderer(blocks: DynamicPageData['blocks'], locale: string) {
  return blocks.map(block => ({
    id: block.id,
    layoutId: block.layoutId,
    blockType: block.blockType,
    blockKey: block.blockKey,
    displayOrder: block.displayOrder,
    isVisible: block.isVisible,
    configuration: block.configuration,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [{
      id: 0,
      blockId: block.id,
      locale: locale,
      content: block.localizedContent ? JSON.stringify(block.localizedContent) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  }));
}