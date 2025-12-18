/**
 * Cookie Consent Utility Functions
 * 
 * Manages cookie consent preferences in localStorage
 * Complies with PDPA (Personal Data Protection Act 2010) Malaysia
 */

const CONSENT_STORAGE_KEY = "cookie-consent-preference";

export type CookieConsentPreference = "accepted" | "rejected" | null;

/**
 * Get the current cookie consent preference from localStorage
 * @returns The user's consent preference or null if not set
 */
export function getCookieConsent(): CookieConsentPreference {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "accepted" || stored === "rejected") {
      return stored;
    }
    return null;
  } catch (error) {
    console.error("Error reading cookie consent:", error);
    return null;
  }
}

/**
 * Set the cookie consent preference in localStorage
 * @param preference - The user's consent preference
 */
export function setCookieConsent(preference: "accepted" | "rejected"): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, preference);
  } catch (error) {
    console.error("Error saving cookie consent:", error);
  }
}

/**
 * Check if the user has already given consent (accepted or rejected)
 * @returns true if consent has been given, false otherwise
 */
export function hasCookieConsent(): boolean {
  const consent = getCookieConsent();
  return consent !== null;
}

/**
 * Clear the cookie consent preference (useful for testing/debugging)
 */
export function clearCookieConsent(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing cookie consent:", error);
  }
}
