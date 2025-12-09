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
        setAll() {
          // No-op: cookies cannot be modified in Server Components
        },
      },
    }
  );
}

/**
 * Get a full Supabase client for Server Actions and Route Handlers
 * This client can modify cookies and should only be used in Server Actions or Route Handlers
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
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
      // Log error but don't throw - return null for invalid sessions
      if (error.code !== "refresh_token_not_found" && error.code !== "session_not_found") {
        console.error("Auth error:", error.message);
      }
      return null;
    }
    
    return user;
  } catch (err) {
    console.error("Unexpected auth error:", err);
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
