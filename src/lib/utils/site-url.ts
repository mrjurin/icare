/**
 * Get the base URL for the application
 * Used for generating absolute URLs in emails, redirects, etc.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (explicitly set)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. localhost:3000 (development fallback)
 */
export function getSiteUrl(): string {
  // Check for explicitly set site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Check for Vercel URL (automatically set in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development fallback
  return "http://localhost:3000";
}

/**
 * Get the base URL for email verification links
 * This ensures verification links point to the correct domain
 */
export function getEmailVerificationUrl(): string {
  const baseUrl = getSiteUrl();
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, "");
}
