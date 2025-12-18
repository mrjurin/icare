"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useLoadingOverlay } from "@/hooks/useLoadingOverlay";

/**
 * Component that detects navigation changes and shows loading overlay
 * This works for both Next.js Link components and regular anchor tags
 * Detects links in top navbar, sidebar, and anywhere else in the app
 */
export default function NavigationLoadingDetector() {
  const pathname = usePathname();
  const { setLoading } = useLoadingOverlay();
  const t = useTranslations('common');
  const previousPathname = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  // Listen for link clicks to show loading immediately
  // This catches all links: top navbar, sidebar, buttons with links, etc.
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Check if the click target or any parent is a link
      let element: HTMLElement | null = e.target as HTMLElement;
      let link: HTMLAnchorElement | null = null;

      // Traverse up the DOM tree to find the closest anchor tag
      while (element && !link) {
        if (element.tagName === "A" && element.hasAttribute("href")) {
          link = element as HTMLAnchorElement;
          break;
        }
        element = element.parentElement;
      }

      if (link && link.href) {
        // Skip if it's a button or has download attribute
        if (link.hasAttribute("download") || link.getAttribute("target") === "_blank") {
          return;
        }

        // Check if it's an internal link (same origin)
        try {
          const linkUrl = new URL(link.href, window.location.origin);
          const currentUrl = new URL(window.location.href);

          // Only show loading for internal navigation (not same page)
          const isInternal = linkUrl.origin === currentUrl.origin;
          const isDifferentPath = linkUrl.pathname !== currentUrl.pathname;
          const isNotHashOnly = !linkUrl.hash || linkUrl.pathname !== currentUrl.pathname;

          if (isInternal && isDifferentPath && isNotHashOnly) {
            isNavigatingRef.current = true;
            setLoading(true, t('loadingPage'));
          }
        } catch (err) {
          // Invalid URL, ignore
        }
      }
    };

    // Listen for clicks on links (capture phase to catch early, before any preventDefault)
    // This ensures we catch clicks on all links including those in top navbar and sidebar
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [setLoading]);

  // Detect pathname changes to hide loading overlay
  useEffect(() => {
    // Normalize pathnames for comparison (remove trailing slashes)
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedPrevious = previousPathname.current?.replace(/\/$/, '') || null;

    // If pathname changed, hide loading (regardless of how it was set)
    if (normalizedPrevious !== null && normalizedPrevious !== normalizedPathname) {
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Hide loading overlay when pathname changes
      // Use a small delay to ensure smooth transition
      navigationTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        isNavigatingRef.current = false;
      }, 100);
    } else if (normalizedPrevious === null) {
      // First render - just set the pathname
      previousPathname.current = normalizedPathname;
      // Make sure loading is not shown on initial render
      setLoading(false);
      isNavigatingRef.current = false;
    }

    // Update previous pathname
    previousPathname.current = normalizedPathname;
  }, [pathname, setLoading]);

  // Monitor browser URL changes to catch locale switches and other programmatic navigation
  // This is needed because next-intl's usePathname might not always reflect locale changes immediately
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastBrowserPath = window.location.pathname;

    const checkUrlChange = () => {
      const currentBrowserPath = window.location.pathname;
      if (currentBrowserPath !== lastBrowserPath) {
        lastBrowserPath = currentBrowserPath;
        // URL changed, hide loading
        setLoading(false);
        isNavigatingRef.current = false;
      }
    };

    // Check on popstate (browser back/forward) and when DOM is ready
    window.addEventListener('popstate', checkUrlChange);
    
    // Also check when page becomes visible (handles some edge cases)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUrlChange();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check after a short delay to catch any pending navigation
    const initialCheck = setTimeout(checkUrlChange, 300);

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener('popstate', checkUrlChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setLoading]);

  // Fallback: Hide loading overlay when page is fully loaded
  useEffect(() => {
    const handleLoad = () => {
      if (isNavigatingRef.current) {
        setLoading(false);
        isNavigatingRef.current = false;
      }
    };

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, [setLoading]);

  // Safety fallback: Hide loading after maximum timeout (5 seconds)
  // This runs whenever pathname changes to set up a new timeout if needed
  useEffect(() => {
    let maxTimeout: NodeJS.Timeout | null = null;

    if (isNavigatingRef.current) {
      maxTimeout = setTimeout(() => {
        if (isNavigatingRef.current) {
          setLoading(false);
          isNavigatingRef.current = false;
        }
      }, 5000);
    }

    return () => {
      if (maxTimeout) {
        clearTimeout(maxTimeout);
      }
    };
  }, [pathname, setLoading]);

  return null;
}


