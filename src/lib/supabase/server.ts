import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No-op: cookies cannot be modified in Server Components
        },
        remove() {
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
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
