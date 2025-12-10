import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Get a read-only Supabase client for Server Components
 * This client only reads cookies and does not modify them
 * Use this in Server Components (layouts, pages) to avoid cookie modification errors
 */
export async function getSupabaseReadOnlyClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // No-op: cookies cannot be modified in Server Components
          // Silently ignore cookie modification attempts to prevent errors
          // This happens when Supabase tries to refresh the session
        },
      },
    }
  );
}

/**
 * Get a full Supabase client for Server Actions and Route Handlers
 * This client can modify cookies and should only be used in Server Actions or Route Handlers
 * 
 * Note: If called from a Server Component, this will throw an error.
 * Use getSupabaseReadOnlyClient() instead for Server Components.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch (error) {
            // If cookie modification fails (e.g., in Server Component), 
            // it means we're in the wrong context - this is expected
            // The error will be caught by the caller
            throw error;
          }
        },
      },
    }
  );
}

/**
 * Helper to safely get the current user, handling invalid refresh tokens gracefully
 * Returns null if user is not authenticated or if session is invalid
 * Use this instead of directly calling supabase.auth.getUser() to avoid unhandled errors
 */
export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Handle invalid refresh token by clearing the session
      if (error.code === "refresh_token_not_found" || error.code === "session_not_found") {
        console.warn("Invalid session detected, clearing cookies");
        await clearAuthCookies();
        return null;
      }
      // Log other auth errors but don't throw
      console.error("Auth error:", error.message);
      return null;
    }
    
    return user;
  } catch (err) {
    // Catch any unexpected errors
    console.error("Unexpected auth error:", err);
    return null;
  }
}

/**
 * Helper to safely get the current user (read-only version for Server Components)
 * Returns null if user is not authenticated or if session is invalid
 */
export async function getAuthenticatedUserReadOnly() {
  const supabase = await getSupabaseReadOnlyClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Don't log expected session errors - these are normal when user is not authenticated
      // Only log unexpected errors
      const expectedErrors = [
        "refresh_token_not_found",
        "session_not_found",
        "Auth session missing!",
        "Invalid Refresh Token: Refresh Token Not Found",
      ];
      
      const isExpectedError = expectedErrors.some(
        (expected) => error.code === expected || error.message?.includes(expected)
      );
      
      if (!isExpectedError) {
        console.error("Auth error:", error.message);
      }
      return null;
    }
    
    return user;
  } catch (err) {
    // Don't log if it's a session-related error
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (!errorMessage.includes("session") && !errorMessage.includes("Session")) {
      console.error("Unexpected auth error:", err);
    }
    return null;
  }
}

/**
 * Clear all Supabase auth cookies
 * Call this when a session is invalid and needs to be cleaned up
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Clear all Supabase auth-related cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
      cookieStore.set({
        name: cookie.name,
        value: "",
        maxAge: 0,
        path: "/",
      });
    }
  });
}
